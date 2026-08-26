import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { CONFIG } from '../constants/config';
import { useAppDispatch, useAppSelector } from './redux';
import { logout } from '../app/slices/authSlice';
import { clearTokens } from '../utils/keychain';

export const useInactivityTimer = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const backgroundTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        backgroundTimestampRef.current = Date.now();
      } else if (nextAppState === 'active' && backgroundTimestampRef.current) {
        const elapsed = Date.now() - backgroundTimestampRef.current;
        backgroundTimestampRef.current = null;

        if (elapsed >= CONFIG.INACTIVITY_TIMEOUT_MS) {
          console.log('[Auth] Inactivity timeout reached. Logging out...');
          await clearTokens();
          dispatch(logout());
          Alert.alert(
            'Session Expired',
            'You have been logged out due to 30 minutes of inactivity. Please sign in again.'
          );
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, dispatch]);
};
