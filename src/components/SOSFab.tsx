import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS, SHADOWS, SPACING } from '../constants/theme';

interface SOSFabProps {
  onPress: () => void;
  visible?: boolean;
}

export const SOSFab: React.FC<SOSFabProps> = ({ onPress, visible = true }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.positionWrapper} pointerEvents="box-none">
      <Animated.View style={[styles.pulseRing, animatedStyle]} pointerEvents="none" />
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.fabButton}
        accessibilityLabel="Emergency SOS Button"
        accessibilityRole="button"
      >
        <Text style={styles.sosIcon}>🚨</Text>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  positionWrapper: {
    position: 'absolute',
    bottom: 80,
    right: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  pulseRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  fabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.sosRed,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glowSos,
  },
  sosIcon: {
    fontSize: 14,
    lineHeight: 16,
  },
  sosText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    marginTop: -2,
  },
});
