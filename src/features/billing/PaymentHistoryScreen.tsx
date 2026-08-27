import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CreditCardIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useGetPaymentHistoryQuery, PaymentTransaction } from './billingApi';
import { EmptyState } from '../../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentHistory'>;

export const PaymentHistoryScreen: React.FC<Props> = () => {
  const { data: historyResponse, isLoading, isFetching, refetch } = useGetPaymentHistoryQuery();
  const payments = historyResponse?.data?.payments || [];

  const renderStatusBadge = (status: PaymentTransaction['status']) => {
    switch (status) {
      case 'captured':
        return (
          <View style={[styles.statusBadge, styles.statusCaptured]}>
            <Text style={styles.statusTextCaptured}>SUCCESS</Text>
          </View>
        );
      case 'refunded':
        return (
          <View style={[styles.statusBadge, styles.statusRefunded]}>
            <Text style={styles.statusTextRefunded}>REFUNDED</Text>
          </View>
        );
      case 'failed':
      default:
        return (
          <View style={[styles.statusBadge, styles.statusFailed]}>
            <Text style={styles.statusTextFailed}>FAILED</Text>
          </View>
        );
    }
  };

  const renderPaymentCard = ({ item: payment }: { item: PaymentTransaction }) => {
    const formattedDate = new Date(payment.createdAt || Date.now()).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconCircle}>
              <HugeIcon icon={CreditCardIcon} size={18} color={COLORS.primary} />
            </View>
            <View style={{ marginLeft: SPACING.sm }}>
              <Text style={styles.paymentId}>
                {payment.paymentId || `PAY-${payment._id.slice(-8).toUpperCase()}`}
              </Text>
              <Text style={styles.paymentDate}>{formattedDate}</Text>
            </View>
          </View>
          {renderStatusBadge(payment.status)}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.orderLabel}>Razorpay Order</Text>
            <Text style={styles.orderValue}>{payment.orderId || 'Direct Payment'}</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amountLabel}>Amount Paid</Text>
            <Text style={styles.amountValue}>₹{payment.amount}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment History</Text>
        <Text style={styles.subtitle}>Log of transactions processed via Razorpay gateway</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading payment records...</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          renderItem={renderPaymentCard}
          contentContainerStyle={styles.listContent}
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
          ListEmptyComponent={
            <EmptyState
              icon={CreditCardIcon}
              title="No Payment Records"
              description="No past gateway transactions found for this account."
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentId: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },
  paymentDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusCaptured: {
    backgroundColor: COLORS.successGreenMuted,
    borderWidth: 1,
    borderColor: COLORS.successGreen,
  },
  statusTextCaptured: {
    color: COLORS.successGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  statusRefunded: {
    backgroundColor: COLORS.infoBlueMuted,
    borderWidth: 1,
    borderColor: COLORS.infoBlue,
  },
  statusTextRefunded: {
    color: COLORS.infoBlue,
    fontSize: 10,
    fontWeight: '800',
  },
  statusFailed: {
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1,
    borderColor: COLORS.sosRed,
  },
  statusTextFailed: {
    color: COLORS.sosRed,
    fontSize: 10,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  orderLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  orderValue: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginTop: 1,
  },
  amountLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});
