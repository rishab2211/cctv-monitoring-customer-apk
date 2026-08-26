import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useShareCameraMutation } from './cameraApi';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareCamera'>;

export const ShareCameraScreen: React.FC<Props> = ({ navigation, route }) => {
  const camera = route.params?.camera;
  const cameraId = camera?._id || route.params?.cameraId || '';
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [shareCameraMutation, { isLoading }] = useShareCameraMutation();

  const handleShare = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!cameraId) {
      setErrorMessage('Camera identifier missing.');
      return;
    }

    Keyboard.dismiss();
    setErrorMessage(null);

    try {
      await shareCameraMutation({
        cameraId,
        email: email.trim().toLowerCase(),
      }).unwrap();

      Alert.alert(
        'Camera Shared Successfully',
        `Live access to "${camera?.name || 'this camera'}" has been shared with ${email.trim()}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('[ShareCamera] Error:', err);
      setErrorMessage(
        err.data?.message || err.message || 'Unable to share camera. Please check the recipient email.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>👥</Text>
          </View>
          <Text style={styles.title}>Share Camera Access</Text>
          <Text style={styles.subtitle}>
            Grant trusted family members or staff real-time access to{' '}
            <Text style={styles.cameraNameHighlight}>{camera?.name || 'this camera'}</Text>
          </Text>
        </View>

        {/* Subscription Requirement Notice */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeIcon}>ℹ️</Text>
          <Text style={styles.noticeText}>
            <Text style={{ fontWeight: '700' }}>Note:</Text> Shared recipients must have a registered account and an active subscription to watch live streams.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Registered Email</Text>
            <TextInput
              style={styles.input}
              placeholder="family.member@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.primaryButton, (!email.trim() || isLoading) && styles.buttonDisabled]}
            onPress={handleShare}
            disabled={!email.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.primaryButtonText}>Grant Access</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelLink}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
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
    marginBottom: SPACING.md,
    ...SHADOWS.glowTeal,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.sm,
  },
  cameraNameHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  noticeCard: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.25)',
    marginBottom: SPACING.lg,
  },
  noticeIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.infoBlue,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorBannerText: {
    color: COLORS.sosRed,
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glowTeal,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelLink: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  cancelLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
