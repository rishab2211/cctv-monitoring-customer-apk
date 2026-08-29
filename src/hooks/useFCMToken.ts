import { useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  getInitialNotification,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { useRegisterDeviceTokenMutation } from '../features/notifications/notificationsApi';
import { useAppDispatch, useAppSelector } from './redux';
import { baseApi } from '../api/rtk-query/baseApi';

export const useFCMToken = (navigationRef?: any) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [registerDeviceTokenMutation] = useRegisterDeviceTokenMutation();

  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribeOnMessage: (() => void) | undefined;
    let unsubscribeOnTokenRefresh: (() => void) | undefined;
    let unsubscribeNotificationOpened: (() => void) | undefined;

    const requestUserPermission = async () => {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('[FCM] Notification permission denied on Android 13+');
            return false;
          }
        }

        const messagingInstance = getMessaging();
        const authStatus = await requestPermission(messagingInstance);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        return enabled;
      } catch (err) {
        console.warn('[FCM] Permission request failed:', err);
        return false;
      }
    };

    const registerToken = async (fcmToken: string) => {
      try {
        await registerDeviceTokenMutation({
          token: fcmToken,
          deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
        }).unwrap();
        console.log('[FCM] Device token registered successfully');
      } catch (err) {
        console.warn('[FCM] Failed to register token with backend:', err);
      }
    };

    const handleNavigate = (remoteMessage: any) => {
      const nav = navigationRef?.current || navigationRef;
      if (!nav || !nav.isReady?.()) return;

      const entityType = remoteMessage?.data?.entityType?.toLowerCase();
      const entityId = remoteMessage?.data?.entityId;

      if (entityType === 'sos' && entityId) {
        nav.navigate('SOSDetail', { sosId: entityId });
      } else if (entityType === 'incident' && entityId) {
        nav.navigate('IncidentDetail', { incidentId: entityId });
      } else if (entityType === 'ticket' && entityId) {
        nav.navigate('TicketDetail', { ticketId: entityId });
      } else if (entityType === 'camera' && entityId) {
        nav.navigate('LiveView', { cameraId: entityId });
      } else if (entityType === 'invoice' && entityId) {
        nav.navigate('InvoiceDetail', { invoiceId: entityId });
      } else if (entityType === 'invoice') {
        nav.navigate('InvoiceList');
      } else if (entityType === 'subscription') {
        nav.navigate('MainTabs', { screen: 'TabBilling' });
      } else {
        nav.navigate('Notifications');
      }
    };

    const initFCM = async () => {
      const hasPermission = await requestUserPermission();
      if (!hasPermission) return;

      const messagingInstance = getMessaging();

      try {
        const token = await getToken(messagingInstance);
        if (token) {
          await registerToken(token);
        }
      } catch (err) {
        console.warn('[FCM] Error getting FCM token:', err);
      }

      // Listen for token refresh
      unsubscribeOnTokenRefresh = onTokenRefresh(messagingInstance, async (newToken: string) => {
        console.log('[FCM] Token refreshed:', newToken);
        await registerToken(newToken);
      });

      // Foreground message handler
      unsubscribeOnMessage = onMessage(messagingInstance, async (remoteMessage: any) => {
        console.log('[FCM] Foreground notification received:', remoteMessage);

        // Invalidate relevant caches
        dispatch(baseApi.util.invalidateTags(['Notifications', 'Dashboard']));

        // Display brief in-app alert/banner
        if (remoteMessage.notification) {
          Alert.alert(
            remoteMessage.notification.title || 'Security Notification',
            remoteMessage.notification.body || 'You have a new update.',
            [
              { text: 'Dismiss', style: 'cancel' },
              {
                text: 'View',
                onPress: () => handleNavigate(remoteMessage),
              },
            ]
          );
        }
      });

      // Background notification opened
      unsubscribeNotificationOpened = onNotificationOpenedApp(
        messagingInstance,
        (remoteMessage: any) => {
          console.log('[FCM] Notification opened from background:', remoteMessage);
          handleNavigate(remoteMessage);
        }
      );

      // Terminated app initial notification
      getInitialNotification(messagingInstance).then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('[FCM] App opened from quit state by notification:', remoteMessage);
          handleNavigate(remoteMessage);
        }
      });
    };

    initFCM();

    return () => {
      if (unsubscribeOnMessage) unsubscribeOnMessage();
      if (unsubscribeOnTokenRefresh) unsubscribeOnTokenRefresh();
      if (unsubscribeNotificationOpened) unsubscribeNotificationOpened();
    };
  }, [isAuthenticated, registerDeviceTokenMutation, dispatch, navigationRef]);
};
