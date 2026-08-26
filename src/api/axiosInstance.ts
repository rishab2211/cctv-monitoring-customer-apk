import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { CONFIG } from '../constants/config';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/keychain';

export const axiosInstance = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const setAuthHeader = (config: InternalAxiosRequestConfig, token: string) => {
  if (!config.headers) {
    config.headers = {} as any;
  }
  if (typeof (config.headers as any).set === 'function') {
    (config.headers as any).set('Authorization', `Bearer ${token}`);
  } else {
    config.headers.Authorization = `Bearer ${token}`;
  }
};

// Request Interceptor: Attach JWT Bearer token from Keychain
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getAccessToken();
      if (token) {
        setAuthHeader(config, token);
      }
    } catch (err) {
      console.warn('[Axios] Failed to attach access token', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// External store injection to avoid circular dependency
let onLogoutCallback: (() => void) | null = null;
let onRateLimitCallback: ((seconds: number) => void) | null = null;

export const setAuthCallbacks = (
  onLogout: () => void,
  onRateLimit?: (seconds: number) => void
) => {
  onLogoutCallback = onLogout;
  if (onRateLimit) {
    onRateLimitCallback = onRateLimit;
  }
};

// Response Interceptor: Silent 401 Refresh & 429 Handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Guard against undefined config on network errors / early aborts
    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      const retryAfterHeader = error.response.headers?.['retry-after'];
      const retrySeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
      if (onRateLimitCallback) {
        onRateLimitCallback(retrySeconds);
      }
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';

    // Don't retry auth endpoints themselves
    if (
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh-token') ||
      requestUrl.includes('/auth/register')
    ) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized (Token Expiry)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue pending requests while refresh is ongoing
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            setAuthHeader(originalRequest, newToken);
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await getRefreshToken();
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        // Call backend refresh-token endpoint directly with raw axios
        const refreshResponse = await axios.post(
          `${CONFIG.API_BASE_URL}/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          { timeout: 10000 }
        );

        const data = refreshResponse.data?.data || refreshResponse.data;
        const newAccessToken = data.accessToken || data.token;
        const newRefreshToken = data.refreshToken || storedRefreshToken;

        if (!newAccessToken) {
          throw new Error('Token refresh did not return a valid access token');
        }

        // Update Keychain
        await saveTokens(newAccessToken, newRefreshToken);

        // Update original request with new token
        setAuthHeader(originalRequest, newAccessToken);

        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Force logout on refresh token failure
        await clearTokens();
        if (onLogoutCallback) {
          onLogoutCallback();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
