import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CctvCameraIcon,
  Shield01Icon,
  Globe02Icon,
  File01Icon,
  LockIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export const AboutScreen: React.FC<Props> = () => {
  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open link', url);
      }
    } catch {
      Alert.alert('Unable to open link', url);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* App Branding */}
      <View style={styles.brandingBox}>
        <View style={styles.logoCircle}>
          <HugeIcon icon={CctvCameraIcon} size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.appName}>CCTV Customer</Text>
        <Text style={styles.versionText}>Version 0.0.1 (Build 101)</Text>
        <Text style={styles.tagline}>
          AI-Powered Smart Surveillance & Emergency Response Platform
        </Text>
      </View>

      {/* Security Statement Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <HugeIcon icon={Shield01Icon} size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Enterprise-Grade Security</Text>
        </View>
        <Text style={styles.bodyText}>
          All CCTV video streams and telemetry are secured end-to-end with AES-256 encryption.
          Recordings and incident media are stored on certified secure cloud infrastructure.
        </Text>
      </View>

      {/* Legal & Policies */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Legal & Privacy</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => openUrl('https://cctvmonitor.example.com/terms')}
        >
          <View style={styles.iconCircle}>
            <HugeIcon icon={File01Icon} size={18} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.menuLabel}>Terms of Service</Text>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => openUrl('https://cctvmonitor.example.com/privacy')}
        >
          <View style={styles.iconCircle}>
            <HugeIcon icon={LockIcon} size={18} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.menuLabel}>Privacy Policy</Text>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => openUrl('https://cctvmonitor.example.com')}
        >
          <View style={styles.iconCircle}>
            <HugeIcon icon={Globe02Icon} size={18} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.menuLabel}>Official Website</Text>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.copyrightText}>
        © 2026 CCTV Monitoring Systems Inc. All rights reserved.
      </Text>
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
    paddingBottom: SPACING.xxl,
  },
  brandingBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  appName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  versionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tagline: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.subtitle1,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  sectionHeader: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  bodyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.textSecondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  copyrightText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
