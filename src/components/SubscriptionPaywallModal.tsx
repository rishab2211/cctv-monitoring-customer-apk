import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { AlertCircleIcon, StarIcon } from '@hugeicons/core-free-icons';
import { HugeIcon } from './HugeIcon';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';

interface SubscriptionPaywallModalProps {
  visible: boolean;
  type?: 'upgrade' | 'pay_now' | null;
  onClose: () => void;
  onNavigateBilling: () => void;
}

export const SubscriptionPaywallModal: React.FC<SubscriptionPaywallModalProps> = ({
  visible,
  type = 'upgrade',
  onClose,
  onNavigateBilling,
}) => {
  if (!visible) return null;

  const isPastDue = type === 'pay_now';

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <HugeIcon
              icon={isPastDue ? AlertCircleIcon : StarIcon}
              size={32}
              color={isPastDue ? COLORS.warningAmber : COLORS.primary}
              strokeWidth={1.8}
            />
          </View>

          <Text style={styles.title}>
            {isPastDue ? 'Subscription Past Due' : 'Active Subscription Required'}
          </Text>

          <Text style={styles.description}>
            {isPastDue
              ? 'Your subscription payment is overdue. Please settle the pending invoice to restore live streaming & recording access.'
              : 'Live video streaming and cloud playback require an active CCTV security subscription plan.'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.primaryButton}
            onPress={() => {
              onClose();
              onNavigateBilling();
            }}
          >
            <Text style={styles.primaryButtonText}>
              {isPastDue ? 'Pay Now & Resume Feed' : 'Explore Plans & Upgrade'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayHeavy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xxl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    ...SHADOWS.medium,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.glowTeal,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.md,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.glowTeal,
    marginBottom: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
