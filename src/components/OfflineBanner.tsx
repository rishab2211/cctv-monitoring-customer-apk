import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { COLORS, SPACING } from '../constants/theme';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { setOffline } from '../app/slices/uiSlice';

export const OfflineBanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOffline = useAppSelector((state) => state.ui.isOffline);

  useEffect(() => {
    // Initial fetch on mount
    NetInfo.fetch().then((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      dispatch(setOffline(offline));
    });

    // Real-time listener for connectivity changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      dispatch(setOffline(offline));
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚠️ No Internet Connection — Working in Offline Mode</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.warningAmber,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  text: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
});
