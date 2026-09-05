import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Invoice01Icon,
  Clock01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';
import {
  useGetCustomerSubscriptionQuery,
  useCancelSubscriptionMutation,
} from './billingApi';

export const BillingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    data: subResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetCustomerSubscriptionQuery();

  const [cancelSubscriptionMutation, { isLoading: isCanceling }] = useCancelSubscriptionMutation();

  const sub = subResponse?.data;
  const planName = sub?.planName || (typeof sub?.planId === 'object' ? sub?.planId?.name : 'Standard Security');
  const planPrice = sub?.amount || (typeof sub?.planId === 'object' ? sub?.planId?.price : 999);

  // Calculate days remaining progress
  const startDate = sub?.startDate ? new Date(sub.startDate) : new Date();
  const endDate = sub?.endDate ? new Date(sub.endDate) : new Date(Date.now() + 30 * 86400000);
  const now = new Date();

  const totalDuration = Math.max(1, endDate.getTime() - startDate.getTime());
  const elapsed = Math.max(0, now.getTime() - startDate.getTime());
  const progressRatio = Math.min(1, Math.max(0, elapsed / totalDuration));
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Security Subscription',
      `Are you sure you want to cancel your ${planName}? Your CCTV monitoring and cloud recording will remain accessible until ${endDate.toLocaleDateString()}.`,
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Confirm Cancellation',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscriptionMutation().unwrap();
              Alert.alert('Subscription Cancelled', 'Your auto-renewal has been cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err.data?.message || 'Failed to cancel subscription.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Billing & Plans</Text>
          <Text style={styles.subtitle}>Manage CCTV surveillance subscription & invoices</Text>
        </View>

        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading subscription details...</Text>
          </View>
        ) : (
          <>
            {/* Active Subscription Overview Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.planHeaderInfo}>
                  <Text style={styles.planLabel}>ACTIVE SURVEILLANCE PLAN</Text>
                  <Text style={styles.planName}>{planName}</Text>
                </View>
                <StatusBadge status={sub?.status || 'active'} />
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceCurrency}>₹</Text>
                <Text style={styles.priceAmount}>{planPrice}</Text>
                <Text style={styles.priceCycle}>/ month</Text>
              </View>

              {/* Progress Bar of Cycle */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelsRow}>
                  <Text style={styles.progressLabel}>Days Remaining</Text>
                  <Text style={styles.progressValue}>
                    {daysRemaining} Days (until {endDate.toLocaleDateString()})
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.round((1 - progressRatio) * 100)}%` },
                      sub?.status !== 'active' && { backgroundColor: COLORS.warningAmber },
                    ]}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                {sub?.status === 'past_due' ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.renewBtn]}
                    onPress={() =>
                      navigation.navigate('Payment', {
                        planId: typeof sub?.planId === 'object' ? sub?.planId?._id : 'default',
                        amount: planPrice,
                        subscriptionId: sub?._id,
                      })
                    }
                  >
                    <Text style={styles.renewBtnText}>Pay Pending Invoice</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.upgradeBtn]}
                    onPress={() => navigation.navigate('PlanSelection')}
                  >
                    <Text style={styles.upgradeBtnText}>Change / Upgrade Plan</Text>
                  </TouchableOpacity>
                )}

                {sub?.status === 'active' ? (
                  <TouchableOpacity
                    style={styles.cancelLink}
                    onPress={handleCancelSubscription}
                    disabled={isCanceling}
                  >
                    <Text style={styles.cancelLinkText}>Cancel Subscription</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Menu Options Section */}
            <View style={styles.menuSection}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.menuItem}
                onPress={() => navigation.navigate('InvoiceList')}
              >
                <View style={styles.menuIconCircle}>
                  <HugeIcon icon={Invoice01Icon} size={18} color={COLORS.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Invoices & Tax Receipts</Text>
                  <Text style={styles.menuSubtitle}>Download PDF billing invoices</Text>
                </View>
                <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.menuItem}
                onPress={() => navigation.navigate('PaymentHistory')}
              >
                <View style={styles.menuIconCircle}>
                  <HugeIcon icon={Clock01Icon} size={18} color={COLORS.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Payment History</Text>
                  <Text style={styles.menuSubtitle}>View Razorpay order logs & transactions</Text>
                </View>
                <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 90,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  planLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  planName: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.lg,
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 2,
  },
  priceAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  priceCycle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  progressSection: {
    marginBottom: SPACING.xl,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  progressValue: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  cardActions: {
    gap: SPACING.sm,
  },
  actionBtn: {
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  upgradeBtn: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.glowTeal,
  },
  upgradeBtnText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  renewBtn: {
    backgroundColor: COLORS.warningAmber,
  },
  renewBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelLink: {
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  cancelLinkText: {
    color: COLORS.sosRed,
    fontSize: 13,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 56,
  },
  centerLoading: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  planHeaderInfo: {
    flex: 1,
  },
});

