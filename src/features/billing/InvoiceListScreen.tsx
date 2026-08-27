import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  Invoice01Icon,
  Download01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useGetCustomerInvoicesQuery, Invoice } from './billingApi';
import { EmptyState } from '../../components/EmptyState';
import { CONFIG } from '../../constants/config';
import { getAccessToken } from '../../utils/keychain';

type Props = NativeStackScreenProps<RootStackParamList, 'InvoiceList'>;

export const InvoiceListScreen: React.FC<Props> = ({ navigation }) => {
  const { data: invoicesResponse, isLoading, isFetching, refetch } = useGetCustomerInvoicesQuery();
  const invoices = invoicesResponse?.data?.invoices || [];

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const token = await getAccessToken();
      const downloadUrl = `${CONFIG.API_BASE_URL}/invoices/${invoice._id}/download`;
      const { dirs } = ReactNativeBlobUtil.fs;
      const path = `${dirs.DocumentDir}/Invoice_${invoice.invoiceNumber || invoice._id}.pdf`;

      Alert.alert('Downloading Invoice', 'Preparing invoice PDF receipt...');

      await ReactNativeBlobUtil.config({
        fileCache: true,
        path,
      }).fetch('GET', downloadUrl, {
        Authorization: `Bearer ${token}`,
      });

      Alert.alert(
        'Invoice Downloaded',
        `Invoice #${invoice.invoiceNumber || invoice._id.slice(-6)} saved to your device.`,
        [
          { text: 'OK' },
          {
            text: 'Open / Share',
            onPress: () => {
              if (Platform.OS === 'ios') {
                ReactNativeBlobUtil.ios.openDocument(path);
              } else {
                ReactNativeBlobUtil.android.actionViewIntent(path, 'application/pdf');
              }
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('[InvoiceDownload] Error:', err);
      Alert.alert('Download Failed', 'Could not download invoice PDF. Please try again later.');
    }
  };

  const renderStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return (
          <View style={[styles.statusBadge, styles.statusPaid]}>
            <Text style={styles.statusTextPaid}>PAID</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Text style={styles.statusTextPending}>PENDING</Text>
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

  const renderInvoiceCard = ({ item: invoice }: { item: Invoice }) => {
    const formattedDate = new Date(invoice.billingDate || Date.now()).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice._id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconCircle}>
              <HugeIcon icon={Invoice01Icon} size={18} color={COLORS.primary} />
            </View>
            <View style={{ marginLeft: SPACING.sm }}>
              <Text style={styles.invoiceNumber}>
                #{invoice.invoiceNumber || invoice._id.slice(-8).toUpperCase()}
              </Text>
              <Text style={styles.invoiceDate}>{formattedDate}</Text>
            </View>
          </View>
          {renderStatusBadge(invoice.status)}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Total Billed</Text>
            <Text style={styles.amountValue}>₹{invoice.amount}</Text>
          </View>

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => handleDownloadInvoice(invoice)}
          >
            <HugeIcon icon={Download01Icon} size={14} color={COLORS.primary} />
            <Text style={styles.downloadBtnText}>PDF</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoices & Receipts</Text>
        <Text style={styles.subtitle}>Download past billing invoices & tax statements</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading invoice records...</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item._id}
          renderItem={renderInvoiceCard}
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
              icon={Invoice01Icon}
              title="No Invoices Yet"
              description="Your account has no generated billing invoices at this time."
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
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  invoiceDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusPaid: {
    backgroundColor: COLORS.successGreenMuted,
    borderWidth: 1,
    borderColor: COLORS.successGreen,
  },
  statusTextPaid: {
    color: COLORS.successGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  statusPending: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
  },
  statusTextPending: {
    color: COLORS.warningAmber,
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
  amountLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  downloadBtn: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.button,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  downloadBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
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
