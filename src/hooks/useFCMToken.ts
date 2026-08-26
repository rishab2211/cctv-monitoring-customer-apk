import { useEffect } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { axiosInstance } from '../api/axiosInstance';
import { useAppSelector } from './redux';

export const useFCMToken = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    let unsubscribeTokenRefresh: (() => void) | null = null;

    const registerFCMDevice = async () => {
      try {
        // Request user permission for notifications
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('[FCM] Notification permission not granted');
          return;
        }

        // Get FCM Device Token
        const fcmToken = await messaging().getToken();
        if (fcmToken && isMounted) {
          console.log('[FCM] Token retrieved:', fcmToken.substring(0, 15) + '...');
          await axiosInstance.post('/notifications/register-device', {
            token: fcmToken,
            platform: Platform.OS,
          });
          console.log('[FCM] Device registered successfully with backend');
        }
      } catch (error) {
        // Soft fail if Firebase is not yet configured with google-services.json
        console.warn('[FCM] FCM registration skipped or failed:', error);
      }
    };

    registerFCMDevice();

    // Listen for FCM token refresh with safe initialization guard
    try {
      unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
        try {
          console.log('[FCM] Token refreshed, re-registering...');
          await axiosInstance.post('/notifications/register-device', {
            token: newToken,
            platform: Platform.OS,
          });
        } catch (err) {
          console.warn('[FCM] Failed to update refreshed FCM token:', err);
        }
      });
    } catch (listenerErr) {
      console.warn('[FCM] Firebase onTokenRefresh listener not attached:', listenerErr);
    }

    return () => {
      isMounted = false;
      if (typeof unsubscribeTokenRefresh === 'function') {
        unsubscribeTokenRefresh();
      }
    };
  }, [isAuthenticated]);
};
