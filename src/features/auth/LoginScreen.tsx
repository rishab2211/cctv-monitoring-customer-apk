import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jwtDecode } from 'jwt-decode';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { loginSchema, LoginFormValues } from './schemas';
import { useLoginMutation } from './authApi';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setCredentials } from '../../app/slices/authSlice';
import { setRateLimitCountdown } from '../../app/slices/uiSlice';
import { saveTokens } from '../../utils/keychain';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const rateLimitCountdown = useAppSelector((state) => state.ui.rateLimitCountdown);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loginMutation, { isLoading }] = useLoginMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  // Countdown timer for 429 rate limit
  useEffect(() => {
    if (!rateLimitCountdown || rateLimitCountdown <= 0) return;
    const interval = setInterval(() => {
      dispatch(setRateLimitCountdown(rateLimitCountdown - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitCountdown, dispatch]);

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    const isEmail = values.identifier.includes('@');
    const payload = isEmail
      ? { email: values.identifier.trim().toLowerCase(), password: values.password }
      : { phone: values.identifier.trim(), password: values.password };

    try {
      const response = await loginMutation(payload).unwrap();
      const { user, tokens } = response.data;

      // Decode JWT to enforce Customer RBAC guard
      let userRole = user.role;
      try {
        const decoded = jwtDecode<{ role?: string }>(tokens.accessToken);
        if (decoded.role) {
          userRole = decoded.role as any;
        }
      } catch (decodeErr) {
        console.warn('[Login] JWT decode fallback to response payload:', decodeErr);
      }

      if (userRole !== 'customer') {
        Alert.alert(
          'Access Restricted',
          'Only customer accounts can sign in to this mobile application. Admin and Operator staff must log in through their dedicated portals.'
        );
        return;
      }

      // Save tokens securely in Keychain
      await saveTokens(tokens.accessToken, tokens.refreshToken);

      // Dispatch Redux credentials
      dispatch(
        setCredentials({
          user,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
    } catch (err: any) {
      console.error('[Login] Error:', err);
      if (err.status === 401) {
        setErrorMessage('Invalid credentials. Please verify your email/phone and password.');
      } else if (err.status === 403) {
        setErrorMessage('Your account has been deactivated. Please contact customer support.');
      } else if (err.status === 429) {
        setErrorMessage('Too many login attempts. Please wait for the countdown before retrying.');
      } else {
        setErrorMessage(
          err.data?.message || err.message || 'Unable to sign in. Please check your network connection.'
        );
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🛡️</Text>
          </View>
          <Text style={styles.title}>CCTV Security</Text>
          <Text style={styles.subtitle}>Sign in to monitor your protected premises</Text>
        </View>

        {/* Rate Limit Warning Banner */}
        {rateLimitCountdown && rateLimitCountdown > 0 ? (
          <View style={styles.rateLimitBanner}>
            <Text style={styles.rateLimitText}>
              ⏳ Rate limit active. Please wait {rateLimitCountdown}s before trying again.
            </Text>
          </View>
        ) : null}

        {/* Error Feedback Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        {/* Input Form Card */}
        <View style={styles.form}>
          {/* Email / Phone Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email or Phone Number</Text>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.identifier && styles.inputError]}
                  placeholder="name@example.com or 9876543210"
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading && (!rateLimitCountdown || rateLimitCountdown <= 0)}
                />
              )}
            />
            {errors.identifier ? (
              <Text style={styles.fieldErrorText}>{errors.identifier.message}</Text>
            ) : null}
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      errors.password && styles.inputError,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    editable={!isLoading && (!rateLimitCountdown || rateLimitCountdown <= 0)}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel="Toggle password visibility"
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.fieldErrorText}>{errors.password.message}</Text>
            ) : null}
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Submit Sign In Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.primaryButton,
              (isLoading || (rateLimitCountdown ?? 0) > 0) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading || (rateLimitCountdown ?? 0) > 0}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp')}
            disabled={isLoading}
          >
            <Text style={styles.signUpLink}> Create Account</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: SPACING.xxxl * 1.2,
    paddingBottom: SPACING.xxl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.glowTeal,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  rateLimitBanner: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  rateLimitText: {
    color: COLORS.warningAmber,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
    lineHeight: 18,
  },
  form: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
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
  inputError: {
    borderColor: COLORS.sosRed,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  eyeIcon: {
    fontSize: 16,
  },
  fieldErrorText: {
    color: COLORS.sosRed,
    fontSize: 12,
    marginTop: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xl,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  signUpLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
