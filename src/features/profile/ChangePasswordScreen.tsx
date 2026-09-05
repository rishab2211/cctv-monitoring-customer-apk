import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  LockIcon,
  ViewIcon,
  ViewOffIcon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Shield01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useChangePasswordMutation } from './profileApi';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof changePasswordSchema>;

export const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [changePasswordMutation, { isLoading }] = useChangePasswordMutation();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword') || '';

  const ruleMin8 = newPasswordValue.length >= 8;
  const ruleUpper = /[A-Z]/.test(newPasswordValue);
  const ruleLower = /[a-z]/.test(newPasswordValue);
  const ruleNumber = /[0-9]/.test(newPasswordValue);
  const ruleSpecial = /[^A-Za-z0-9]/.test(newPasswordValue);

  const onSubmit = async (values: FormValues) => {
    try {
      await changePasswordMutation({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      }).unwrap();

      Alert.alert('Password Changed', 'Your password has been successfully updated.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Update Failed',
        err.data?.message || 'Incorrect current password or validation error.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <HugeIcon icon={Shield01Icon} size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Change Account Password</Text>
          </View>
          <Text style={styles.cardSubtext}>
            Enter your current password and create a new secure password.
          </Text>

          {/* Current Password Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.currentPassword && styles.inputError]}
                    placeholder="Enter current password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showCurrent}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!isLoading}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowCurrent(!showCurrent)}
              >
                <HugeIcon
                  icon={showCurrent ? ViewOffIcon : ViewIcon}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
            {errors.currentPassword ? (
              <Text style={styles.errorText}>{errors.currentPassword.message}</Text>
            ) : null}
          </View>

          {/* New Password Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.newPassword && styles.inputError]}
                    placeholder="Enter new strong password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showNew}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!isLoading}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowNew(!showNew)}
              >
                <HugeIcon
                  icon={showNew ? ViewOffIcon : ViewIcon}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword ? (
              <Text style={styles.errorText}>{errors.newPassword.message}</Text>
            ) : null}
          </View>

          {/* Confirm New Password Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.confirmPassword && styles.inputError]}
                    placeholder="Re-type new password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showConfirm}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!isLoading}
                  />
                )}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <HugeIcon
                  icon={showConfirm ? ViewOffIcon : ViewIcon}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
            ) : null}
          </View>

          {/* Password Requirements List */}
          <View style={styles.rulesBox}>
            <Text style={styles.rulesHeader}>Password Strength Requirements:</Text>

            <View style={styles.ruleItem}>
              <HugeIcon
                icon={ruleMin8 ? CheckmarkCircle01Icon : CancelCircleIcon}
                size={14}
                color={ruleMin8 ? COLORS.success : COLORS.textMuted}
              />
              <Text style={[styles.ruleText, ruleMin8 && styles.ruleTextActive]}>
                At least 8 characters
              </Text>
            </View>

            <View style={styles.ruleItem}>
              <HugeIcon
                icon={ruleUpper ? CheckmarkCircle01Icon : CancelCircleIcon}
                size={14}
                color={ruleUpper ? COLORS.success : COLORS.textMuted}
              />
              <Text style={[styles.ruleText, ruleUpper && styles.ruleTextActive]}>
                At least 1 uppercase letter (A-Z)
              </Text>
            </View>

            <View style={styles.ruleItem}>
              <HugeIcon
                icon={ruleLower ? CheckmarkCircle01Icon : CancelCircleIcon}
                size={14}
                color={ruleLower ? COLORS.success : COLORS.textMuted}
              />
              <Text style={[styles.ruleText, ruleLower && styles.ruleTextActive]}>
                At least 1 lowercase letter (a-z)
              </Text>
            </View>

            <View style={styles.ruleItem}>
              <HugeIcon
                icon={ruleNumber ? CheckmarkCircle01Icon : CancelCircleIcon}
                size={14}
                color={ruleNumber ? COLORS.success : COLORS.textMuted}
              />
              <Text style={[styles.ruleText, ruleNumber && styles.ruleTextActive]}>
                At least 1 number (0-9)
              </Text>
            </View>

            <View style={styles.ruleItem}>
              <HugeIcon
                icon={ruleSpecial ? CheckmarkCircle01Icon : CancelCircleIcon}
                size={14}
                color={ruleSpecial ? COLORS.success : COLORS.textMuted}
              />
              <Text style={[styles.ruleText, ruleSpecial && styles.ruleTextActive]}>
                At least 1 special character (!@#$%^&*)
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
          onPress={() => handleSubmit(onSubmit)()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.textInverse} />
          ) : (
            <>
              <HugeIcon icon={LockIcon} size={18} color={COLORS.textInverse} />
              <Text style={styles.submitBtnText}>Update Password</Text>
            </>
          )}
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
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
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
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  cardSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
    lineHeight: 16,
  },
  keyboardAvoid: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    ...TYPOGRAPHY.bodyMedium,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingRight: 45,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  eyeBtn: {
    position: 'absolute',
    right: SPACING.md,
    padding: 4,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: 2,
  },
  rulesBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  rulesHeader: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: SPACING.xs,
  },
  ruleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  ruleTextActive: {
    color: COLORS.success,
    fontWeight: '500',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textInverse,
  },
});
