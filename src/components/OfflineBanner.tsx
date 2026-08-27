import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiDisconnected01Icon } from '@hugeicons/core-free-icons';
import { HugeIcon } from './HugeIcon';
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
      <HugeIcon icon={WifiDisconnected01Icon} size={15} color="#000000" strokeWidth={2} />
      <Text style={styles.text}>No Internet Connection — Working in Offline Mode</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.warningAmber,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  text: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
});
