import React, { useEffect } from 'react';
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
  UserIcon,
  Location01Icon,
  AlertCircleIcon,
  FloppyDiskIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import {
  useGetCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
} from './profileApi';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setUser } from '../../app/slices/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const editProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  emergencyName: z.string().optional(),
  emergencyPhone: z
    .string()
    .refine((val) => !val || /^[6-9]\d{9}$/.test(val), 'Invalid emergency phone number')
    .optional(),
  emergencyRelation: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z
    .string()
    .refine((val) => !val || /^\d{6}$/.test(val), 'Pincode must be 6 digits')
    .optional(),
});

type FormValues = z.infer<typeof editProfileSchema>;

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const { data: profileResponse, isLoading: isLoadingProfile } = useGetCustomerProfileQuery();
  const [updateProfileMutation, { isLoading: isSaving }] = useUpdateCustomerProfileMutation();

  const user = profileResponse?.data?.user || reduxUser;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      emergencyName: user?.emergencyContact?.name || '',
      emergencyPhone: user?.emergencyContact?.phone || '',
      emergencyRelation: user?.emergencyContact?.relation || '',
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        phone: user.phone || '',
        emergencyName: user.emergencyContact?.name || '',
        emergencyPhone: user.emergencyContact?.phone || '',
        emergencyRelation: user.emergencyContact?.relation || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        pincode: user.address?.pincode || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await updateProfileMutation({
        name: values.name.trim(),
        phone: values.phone.trim(),
        emergencyContact: values.emergencyName
          ? {
              name: values.emergencyName.trim(),
              phone: values.emergencyPhone?.trim() || '',
              relation: values.emergencyRelation?.trim() || '',
            }
          : undefined,
        address: values.street || values.city
          ? {
              street: values.street?.trim(),
              city: values.city?.trim(),
              state: values.state?.trim(),
              pincode: values.pincode?.trim(),
            }
          : undefined,
      }).unwrap();

      const updatedUser =
        response?.data?.user ||
        (response?.data as any) || {
          ...user,
          name: values.name.trim(),
          phone: values.phone.trim(),
          emergencyContact: values.emergencyName
            ? {
                name: values.emergencyName.trim(),
                phone: values.emergencyPhone?.trim() || '',
                relation: values.emergencyRelation?.trim() || '',
              }
            : user?.emergencyContact,
          address:
            values.street || values.city
              ? {
                  street: values.street?.trim(),
                  city: values.city?.trim(),
                  state: values.state?.trim(),
                  pincode: values.pincode?.trim(),
                }
              : user?.address,
        };
      if (updatedUser) {
        dispatch(setUser(updatedUser));
      }

      Alert.alert('Success', 'Profile updated successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.data?.message || 'Failed to update profile');
    }
  };

  if (isLoadingProfile && !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile details...</Text>
      </View>
    );
  }

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
        {/* Personal Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <HugeIcon icon={UserIcon} size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Enter full name"
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  editable={!isSaving}
                />
              )}
            />
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mobile Phone *</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="10-digit phone number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  editable={!isSaving}
                />
              )}
            />
            {errors.phone ? (
              <Text style={styles.errorText}>{errors.phone.message}</Text>
            ) : null}
          </View>
        </View>

        {/* Emergency Contact Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <HugeIcon icon={AlertCircleIcon} size={20} color={COLORS.error} />
            <Text style={styles.cardTitle}>Emergency Contact</Text>
          </View>
          <Text style={styles.cardSubtext}>
            Notified immediately when an Emergency SOS is triggered on your account.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contact Name</Text>
            <Controller
              control={control}
              name="emergencyName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Priya Sharma"
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  editable={!isSaving}
                />
              )}
            />
          </View>

          <View style={styles.rowFields}>
            <View style={styles.halfFieldLeft}>
              <Text style={styles.label}>Phone Number</Text>
              <Controller
                control={control}
                name="emergencyPhone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.emergencyPhone && styles.inputError]}
                    placeholder="10-digit number"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!isSaving}
                  />
                )}
              />
              {errors.emergencyPhone ? (
                <Text style={styles.errorText}>{errors.emergencyPhone.message}</Text>
              ) : null}
            </View>

            <View style={styles.halfFieldRight}>
              <Text style={styles.label}>Relationship</Text>
              <Controller
                control={control}
                name="emergencyRelation"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Spouse / Brother"
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!isSaving}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Premises Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <HugeIcon icon={Location01Icon} size={20} color={COLORS.secondary} />
            <Text style={styles.cardTitle}>Monitored Premises Address</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Street Address</Text>
            <Controller
              control={control}
              name="street"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Building, Flat No., Street"
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  editable={!isSaving}
                />
              )}
            />
          </View>

          <View style={styles.rowFields}>
            <View style={styles.halfFieldLeft}>
              <Text style={styles.label}>City</Text>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!isSaving}
                  />
                )}
              />
            </View>

            <View style={styles.halfFieldRight}>
              <Text style={styles.label}>Pincode</Text>
              <Controller
                control={control}
                name="pincode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.pincode && styles.inputError]}
                    placeholder="6-digit PIN"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!isSaving}
                  />
                )}
              />
              {errors.pincode ? (
                <Text style={styles.errorText}>{errors.pincode.message}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Save CTA */}
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={() => handleSubmit(onSubmit)()}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.textInverse} />
          ) : (
            <>
              <HugeIcon icon={FloppyDiskIcon} size={18} color={COLORS.textInverse} />
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
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
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  cardSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  keyboardAvoid: {
    flex: 1,
  },
  halfFieldLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  halfFieldRight: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  rowFields: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    ...TYPOGRAPHY.bodyMedium,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textInverse,
  },
});
