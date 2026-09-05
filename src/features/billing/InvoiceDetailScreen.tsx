import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  Invoice01Icon,
  Download01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useGetInvoiceDetailQuery } from './billingApi';
import { CONFIG } from '../../constants/config';
import { getAccessToken } from '../../utils/keychain';

type Props = NativeStackScreenProps<RootStackParamList, 'InvoiceDetail'>;

export const InvoiceDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { invoiceId } = route.params;
  const { data: invoiceResponse, isLoading } = useGetInvoiceDetailQuery(invoiceId);
  const invoice = (invoiceResponse?.data as any)?.invoice || invoiceResponse?.data;

  const handleDownload = async () => {
    if (!invoice) return;
    try {
      const token = await getAccessToken();
      const downloadUrl = `${CONFIG.API_BASE_URL}/invoices/${invoice._id}/download`;
      const { dirs } = ReactNativeBlobUtil.fs;
      const path = `${dirs.DocumentDir}/Invoice_${invoice.invoiceNumber || invoice._id}.pdf`;

      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        path,
      }).fetch('GET', downloadUrl, {
        Authorization: `Bearer ${token}`,
      });

      Alert.alert('Download Complete', `Invoice saved to ${res.path()}`, [
        { text: 'OK' },
        {
          text: 'Open PDF',
          onPress: () => {
            if (Platform.OS === 'ios') {
              ReactNativeBlobUtil.ios.openDocument(path);
            } else {
              ReactNativeBlobUtil.android.actionViewIntent(path, 'application/pdf');
            }
          },
        },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to download invoice PDF');
    }
  };

  if (isLoading && !invoice) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingSubtext}>Loading invoice statement...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Invoice statement not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDate = new Date(invoice.billingDate || Date.now()).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const subtotal = invoice.subtotal || invoice.amount / 1.18;
  const tax = invoice.tax || invoice.amount - subtotal;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Invoice Header Card */}
        <View style={styles.card}>
          <View style={styles.invoiceHeaderTop}>
            <View style={styles.iconCircle}>
              <HugeIcon icon={Invoice01Icon} size={24} color={COLORS.primary} />
            </View>
            <View
              style={[
                styles.statusBadge,
                invoice.status === 'paid' && styles.statusPaid,
                invoice.status === 'pending' && styles.statusPending,
                invoice.status === 'failed' && styles.statusFailed,
              ]}
            >
              <Text style={styles.statusBadgeText}>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.invoiceNumber}>
            Invoice #{invoice.invoiceNumber || invoice._id.slice(-8).toUpperCase()}
          </Text>
          <Text style={styles.billingDate}>Billing Date: {formattedDate}</Text>

          <View style={styles.divider} />

          {/* Line Items */}
          <Text style={styles.sectionTitle}>Itemized Statement</Text>
          <View style={styles.lineItemRow}>
            <View style={styles.lineItemInfo}>
              <Text style={styles.lineItemTitle}>CCTV Cloud Security Plan (Monthly)</Text>
              <Text style={styles.lineItemDesc}>Cloud storage, AI motion detection & live streams</Text>
            </View>
            <Text style={styles.lineItemAmount}>₹{subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.lineItemRow}>
            <View style={styles.lineItemInfo}>
              <Text style={styles.lineItemTitle}>GST / Sales Tax (18%)</Text>
              <Text style={styles.lineItemDesc}>Government applicable statutory taxes</Text>
            </View>
            <Text style={styles.lineItemAmount}>₹{tax.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Invoiced</Text>
            <Text style={styles.totalAmount}>₹{invoice.amount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Download PDF Action */}
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
          <HugeIcon icon={Download01Icon} size={18} color={COLORS.textInverse} />
          <Text style={styles.downloadBtnText}>Download Tax Invoice (PDF)</Text>
        </TouchableOpacity>
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
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  invoiceHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusPaid: {
    backgroundColor: COLORS.successGreenMuted,
    borderWidth: 1,
    borderColor: COLORS.successGreen,
  },
  statusPending: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
  },
  statusFailed: {
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1,
    borderColor: COLORS.sosRed,
  },
  invoiceNumber: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  billingDate: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  lineItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  lineItemDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  lineItemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
  },
  downloadBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glowTeal,
  },
  downloadBtnText: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: SPACING.xs + 2,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  loadingSubtext: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.sosRed,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.button,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  lineItemInfo: {
    flex: 1,
  },
});

