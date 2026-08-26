import { Platform } from 'react-native';

// Default backend API base URL
// On Android Emulator, 10.0.2.2 points to host machine's localhost:5000
const DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:5000/api/v1',
  ios: 'http://localhost:5000/api/v1',
  default: 'http://localhost:5000/api/v1',
});

const DEV_SOCKET_URL = Platform.select({
  android: 'http://10.0.2.2:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

export const CONFIG = {
  API_BASE_URL: DEV_API_URL,
  SOCKET_URL: DEV_SOCKET_URL,
  APP_SCHEME: 'cctvcustomer',
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  SOS_HOLD_DURATION_MS: 3000, // 3 seconds hold for SOS
  DEFAULT_PAGE_LIMIT: 20,
};
