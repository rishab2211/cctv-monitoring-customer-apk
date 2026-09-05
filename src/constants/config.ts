import { Platform } from 'react-native';

// Production URLs (used for release builds, fallback to local dev during debug)
const PROD_API_URL = 'https://api.yourcctv.com/api/v1';
const PROD_SOCKET_URL = 'https://api.yourcctv.com';

const DEV_API_URL = Platform.select({
  android: 'http://192.168.29.60:5000/api/v1',
  ios: 'http://192.168.29.60:5000/api/v1',
  default: 'http://192.168.29.60:5000/api/v1',
});

const DEV_SOCKET_URL = Platform.select({
  android: 'http://192.168.29.60:5000',
  ios: 'http://192.168.29.60:5000',
  default: 'http://192.168.29.60:5000',
});

export const CONFIG = {
  API_BASE_URL: __DEV__ ? DEV_API_URL : PROD_API_URL,
  SOCKET_URL: __DEV__ ? DEV_SOCKET_URL : PROD_SOCKET_URL,
  APP_SCHEME: 'cctvcustomer',
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  SOS_HOLD_DURATION_MS: 3000, // 3 seconds hold for SOS
  DEFAULT_PAGE_LIMIT: 20,
};
