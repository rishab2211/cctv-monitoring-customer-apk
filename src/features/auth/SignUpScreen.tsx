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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import {
  ViewIcon,
  ViewOffSlashIcon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { signUpSchema, SignUpFormValues } from './schemas';
import { useRegisterMutation } from './authApi';
import { useAppDispatch } from '../../hooks/redux';
import { setCredentials } from '../../app/slices/authSlice';
import { saveTokens } from '../../utils/keychain';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [registerMutation, { isLoading }] = useRegisterMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    setErrorMessage(null);
    try {
      const response = await registerMutation({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        password: values.password,
        role: 'customer',
      }).unwrap();

      const { user, tokens } = response.data;

      // Save tokens in Keychain
      await saveTokens(tokens.accessToken, tokens.refreshToken);

      // Set Redux credentials
      dispatch(
        setCredentials({
          user,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
    } catch (err: any) {
      console.error('[Register] Error:', err);
      if (err.status === 409) {
        setErrorMessage('An account with this email address already exists. Please sign in instead.');
      } else if (err.data?.errors && Array.isArray(err.data.errors)) {
        const errorList = err.data.errors.map((e: any) => e.message).join('\n');
        setErrorMessage(errorList);
      } else {
        setErrorMessage(
          err.data?.message || err.message || 'Registration failed. Please check your details and try again.'
        );
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register for smart CCTV surveillance and rapid emergency response
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <HugeIcon icon={AlertCircleIcon} size={16} color={COLORS.sosRed} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              )}
            />
            {errors.name ? (
              <Text style={styles.fieldErrorText}>{errors.name.message}</Text>
            ) : null}
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="rahul@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              )}
            />
            {errors.email ? (
              <Text style={styles.fieldErrorText}>{errors.email.message}</Text>
            ) : null}
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Phone (10 Digits)</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="9876543210"
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!isLoading}
                />
              )}
            />
            {errors.phone ? (
              <Text style={styles.fieldErrorText}>{errors.phone.message}</Text>
            ) : null}
          </View>

          {/* Password */}
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
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <HugeIcon
                  icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.fieldErrorText}>{errors.password.message}</Text>
            ) : null}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      errors.confirmPassword && styles.inputError,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <HugeIcon
                  icon={showConfirmPassword ? ViewOffSlashIcon : ViewIcon}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.fieldErrorText}>
                {errors.confirmPassword.message}
              </Text>
            ) : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={() => handleSubmit(onSubmit)()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.primaryButtonText}>Register Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}> Sign In</Text>
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
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
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
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  errorBanner: {
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBannerText: {
    color: COLORS.sosRed,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  form: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputGroup: {
    marginBottom: SPACING.md,
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
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
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
  loginLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
