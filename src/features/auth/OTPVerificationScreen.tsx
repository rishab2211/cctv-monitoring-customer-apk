import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useVerifyOtpMutation, useForgotPasswordMutation } from './authApi';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTPVerification'>;

export const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const email = route.params?.email || '';
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const [verifyOtpMutation, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtpMutation, { isLoading: isResending }] = useForgotPasswordMutation();

  const inputRef = useRef<TextInput>(null);

  // Auto-focus the OTP input
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // 60-second countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleVerify = async (codeToVerify?: string) => {
    const targetOtp = codeToVerify || otp;
    if (!email) {
      setErrorMessage('Missing email address. Please start from Forgot Password.');
      return;
    }
    if (targetOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the OTP code.');
      return;
    }

    Keyboard.dismiss();
    setErrorMessage(null);
    try {
      const response = await verifyOtpMutation({
        email: email.trim().toLowerCase(),
        otp: targetOtp,
      }).unwrap();

      const resetToken = response.data.resetToken;

      navigation.navigate('ResetPassword', {
        resetToken,
        email,
      });
    } catch (err: any) {
      console.error('[OTP] Verification error:', err);
      setErrorMessage(
        err.data?.message || err.message || 'Invalid or expired OTP code. Please try again.'
      );
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMessage('Missing email address. Please return to Forgot Password.');
      return;
    }
    if (countdown > 0 || isResending) return;

    setErrorMessage(null);
    setResendSuccess(null);
    try {
      await resendOtpMutation({ email: email.trim().toLowerCase() }).unwrap();
      setCountdown(60);
      setResendSuccess('A fresh 6-digit OTP code has been sent to your email.');
    } catch (err: any) {
      setErrorMessage(
        err.data?.message || err.message || 'Failed to resend OTP. Please try again shortly.'
      );
    }
  };

  const handleOtpChange = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(numeric);
    if (numeric.length === 6) {
      handleVerify(numeric);
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
            <Text style={styles.icon}>✉️</Text>
          </View>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit OTP sent to{' '}
            <Text style={styles.highlightEmail}>{email || 'your email'}</Text>
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        {resendSuccess ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>✅ {resendSuccess}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {/* OTP Box Container */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.otpBoxesRow}
            onPress={() => inputRef.current?.focus()}
          >
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const digit = otp[index] || '';
              const isFocused = otp.length === index;
              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    isFocused && styles.otpBoxFocused,
                    digit !== '' && styles.otpBoxFilled,
                  ]}
                >
                  <Text style={styles.otpDigit}>{digit}</Text>
                </View>
              );
            })}
          </TouchableOpacity>

          {/* Hidden text input for native keyboard input */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={otp}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.primaryButton,
              (otp.length !== 6 || isVerifying) && styles.buttonDisabled,
            ]}
            onPress={() => handleVerify()}
            disabled={otp.length !== 6 || isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.primaryButtonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          {/* Resend Section */}
          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                Resend code in <Text style={styles.countdownNumber}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                disabled={isResending}
                style={styles.resendButton}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.resendText}>Resend OTP Code</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
          disabled={isVerifying}
        >
          <Text style={styles.backLinkText}>← Change Email Address</Text>
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
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
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
    borderWidth: 1,
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
  highlightEmail: {
    color: COLORS.primary,
    fontWeight: '700',
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
  successBanner: {
    backgroundColor: COLORS.successGreenMuted,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.4)',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  successBannerText: {
    color: COLORS.successGreen,
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
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    borderColor: COLORS.primary,
    ...SHADOWS.glowTeal,
  },
  otpBoxFilled: {
    borderColor: COLORS.borderHighlight,
    backgroundColor: COLORS.surfaceElevated,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
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
  resendContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  countdownText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  countdownNumber: {
    color: COLORS.warningAmber,
    fontWeight: '700',
  },
  resendButton: {
    padding: SPACING.xs,
  },
  resendText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  backLink: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  backLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
