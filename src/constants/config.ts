import { Platform } from 'react-native';

// Backend API base URL
// Using local network IP for testing on physical mobile device via Wi-Fi
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
  API_BASE_URL: DEV_API_URL,
  SOCKET_URL: DEV_SOCKET_URL,
  APP_SCHEME: 'cctvcustomer',
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  SOS_HOLD_DURATION_MS: 3000, // 3 seconds hold for SOS
  DEFAULT_PAGE_LIMIT: 20,
};
