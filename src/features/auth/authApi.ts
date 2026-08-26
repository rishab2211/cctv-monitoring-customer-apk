import { baseApi } from '../../api/rtk-query/baseApi';
import { ApiResponse, User } from '../../types';

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  sessionId?: string;
  expiresIn?: number;
}

export interface AuthSuccessData {
  user: User;
  tokens: AuthTokensResponse;
}

export interface SessionItem {
  _id: string;
  sessionId: string;
  deviceName?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  ipAddress?: string;
  isActive: boolean;
  lastActiveAt?: string;
  createdAt: string;
}

export interface SessionsData {
  currentSessionId?: string;
  sessions: SessionItem[];
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      ApiResponse<AuthSuccessData>,
      { email?: string; phone?: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        data: credentials,
      }),
      invalidatesTags: ['Auth', 'Profile', 'Dashboard'],
    }),

    register: builder.mutation<
      ApiResponse<AuthSuccessData>,
      {
        name: string;
        email: string;
        phone: string;
        password: string;
        role?: 'customer';
      }
    >({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        data: {
          ...userData,
          role: 'customer', // Always customer in Customer Mobile App
        },
      }),
      invalidatesTags: ['Auth', 'Profile', 'Dashboard'],
    }),

    getMe: builder.query<ApiResponse<{ user: User }>, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      providesTags: ['Auth', 'Profile'],
    }),

    forgotPassword: builder.mutation<
      ApiResponse<{ maskedEmail: string }>,
      { email: string }
    >({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        data,
      }),
    }),

    verifyOtp: builder.mutation<
      ApiResponse<{ resetToken: string }>,
      { email: string; otp: string }
    >({
      query: (data) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        data,
      }),
    }),

    resetPassword: builder.mutation<
      ApiResponse<null>,
      { resetToken: string; newPassword: string; confirmPassword: string }
    >({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        data,
      }),
    }),

    changePassword: builder.mutation<
      ApiResponse<null>,
      { currentPassword: string; newPassword: string; confirmPassword: string }
    >({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'PUT',
        data,
      }),
    }),

    getSessions: builder.query<ApiResponse<SessionsData>, void>({
      query: () => ({
        url: '/auth/sessions',
        method: 'GET',
      }),
      providesTags: ['Auth'],
    }),

    revokeSession: builder.mutation<ApiResponse<null>, string>({
      query: (sessionId) => ({
        url: `/auth/sessions/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Auth'],
    }),

    revokeAllSessions: builder.mutation<
      ApiResponse<{ revokedCount: number }>,
      void
    >({
      query: () => ({
        url: '/auth/sessions',
        method: 'DELETE',
      }),
      invalidatesTags: ['Auth'],
    }),

    logoutApi: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'Profile', 'Dashboard', 'Cameras', 'SOS', 'Incidents', 'Billing', 'Tickets', 'Notifications'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllSessionsMutation,
  useLogoutApiMutation,
} = authApi;
