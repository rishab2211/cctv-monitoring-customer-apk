import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Notification01Icon,
  AlertCircleIcon,
  Settings01Icon,
  Mail01Icon,
  SmartPhone01Icon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from './notificationsApi';

type Props = NativeStackScreenProps<RootStackParamList, 'NotifPreferences'>;

export const NotificationPreferencesScreen: React.FC<Props> = () => {
  const { data: prefResponse, isLoading } = useGetNotificationPreferencesQuery();
  const [updatePreferencesMutation] = useUpdateNotificationPreferencesMutation();

  const rawPref = prefResponse?.data as any;
  const preferences =
    rawPref?.preferences ||
    rawPref || {
      alerts: { push: true, inApp: true, email: false },
      system: { push: false, inApp: true, email: true },
    };

  const handleToggle = async (
    category: 'alerts' | 'system',
    channel: 'push' | 'inApp' | 'email',
    value: boolean
  ) => {
    try {
      await updatePreferencesMutation({
        [category]: {
          ...preferences[category],
          [channel]: value,
        },
      }).unwrap();
    } catch (err: any) {
      Alert.alert('Error', err.data?.message || 'Failed to update preferences');
    }
  };

  if (isLoading && !prefResponse) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Informational Banner */}
      <View style={styles.infoBanner}>
        <HugeIcon icon={InformationCircleIcon} size={20} color={COLORS.primary} />
        <Text style={styles.infoBannerText}>
          Customize how you receive security alerts, system updates, and account notices across your devices.
        </Text>
      </View>

      {/* Preferences Matrix Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Channels</Text>
        <Text style={styles.cardSubtitle}>
          Choose your preferred notification channels per category.
        </Text>

        {/* Channels Header Icons */}
        <View style={styles.channelHeaderRow}>
          <View style={{ flex: 1 }} />
          <View style={styles.channelHeaderCol}>
            <HugeIcon icon={SmartPhone01Icon} size={16} color={COLORS.textSecondary} />
            <Text style={styles.channelHeaderText}>Push</Text>
          </View>
          <View style={styles.channelHeaderCol}>
            <HugeIcon icon={Notification01Icon} size={16} color={COLORS.textSecondary} />
            <Text style={styles.channelHeaderText}>In-App</Text>
          </View>
          <View style={styles.channelHeaderCol}>
            <HugeIcon icon={Mail01Icon} size={16} color={COLORS.textSecondary} />
            <Text style={styles.channelHeaderText}>Email</Text>
          </View>
        </View>

        {/* Row 1: Security Alerts */}
        <View style={styles.row}>
          <View style={styles.categoryInfo}>
            <View style={[styles.iconBox, { backgroundColor: `${COLORS.error}15` }]}>
              <HugeIcon icon={AlertCircleIcon} size={18} color={COLORS.error} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.categoryTitle}>Security Alerts</Text>
              <Text style={styles.categoryDesc}>SOS triggers, AI motion alerts, camera offline notices</Text>
            </View>
          </View>

          <View style={styles.switchesRow}>
            <View style={styles.switchCol}>
              <Switch
                value={preferences.alerts?.push ?? true}
                onValueChange={(val) => handleToggle('alerts', 'push', val)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
            <View style={styles.switchCol}>
              <Switch
                value={preferences.alerts?.inApp ?? true}
                onValueChange={(val) => handleToggle('alerts', 'inApp', val)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
            <View style={styles.switchCol}>
              <Switch
                value={preferences.alerts?.email ?? false}
                onValueChange={(val) => handleToggle('alerts', 'email', val)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Row 2: System & Account Notices */}
        <View style={styles.row}>
          <View style={styles.categoryInfo}>
            <View style={[styles.iconBox, { backgroundColor: `${COLORS.secondary}15` }]}>
              <HugeIcon icon={Settings01Icon} size={18} color={COLORS.secondary} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.categoryTitle}>System & Billing</Text>
              <Text style={styles.categoryDesc}>Invoices, plan renewals, ticket replies, maintenance</Text>
            </View>
          </View>

          <View style={styles.switchesRow}>
            <View style={styles.switchCol}>
              <Switch
                value={preferences.system?.push ?? false}
                onValueChange={(val) => handleToggle('system', 'push', val)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
            <View style={styles.switchCol}>
              <Switch
                value={preferences.system?.inApp ?? true}
                onValueChange={(val) => handleToggle('system', 'inApp', val)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
            <View style={styles.switchCol}>
              <Switch
                value={preferences.system?.email ?? true}
                onValueChange={(val) => handleToggle('system', 'email', val)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: `${COLORS.primary}25`,
  },
  infoBannerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    flex: 1,
    marginLeft: SPACING.sm,
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.lg,
  },
  channelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  channelHeaderCol: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelHeaderText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  row: {
    paddingVertical: SPACING.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.textPrimary,
  },
  categoryDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  switchesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  switchCol: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
});
