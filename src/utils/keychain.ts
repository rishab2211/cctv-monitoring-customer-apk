import * as Keychain from 'react-native-keychain';

const ACCESS_TOKEN_SERVICE = 'com.cctvcustomer.accessToken';
const REFRESH_TOKEN_SERVICE = 'com.cctvcustomer.refreshToken';

export const saveTokens = async (accessToken: string, refreshToken: string): Promise<boolean> => {
  try {
    await Keychain.setGenericPassword('access', accessToken, {
      service: ACCESS_TOKEN_SERVICE,
    });
    await Keychain.setGenericPassword('refresh', refreshToken, {
      service: REFRESH_TOKEN_SERVICE,
    });
    return true;
  } catch (error) {
    console.error('[Keychain] Error saving tokens:', error);
    return false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    const creds = await Keychain.getGenericPassword({
      service: ACCESS_TOKEN_SERVICE,
    });
    return creds ? creds.password : null;
  } catch (error) {
    console.error('[Keychain] Error getting access token:', error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const creds = await Keychain.getGenericPassword({
      service: REFRESH_TOKEN_SERVICE,
    });
    return creds ? creds.password : null;
  } catch (error) {
    console.error('[Keychain] Error getting refresh token:', error);
    return null;
  }
};

export const clearTokens = async (): Promise<boolean> => {
  try {
    await Keychain.resetGenericPassword({ service: ACCESS_TOKEN_SERVICE });
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE });
    return true;
  } catch (error) {
    console.error('[Keychain] Error clearing tokens:', error);
    return false;
  }
};
