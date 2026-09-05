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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AlertCircleIcon,
  CctvCameraIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useReportIncidentMutation } from './incidentsApi';
import { useGetCamerasQuery } from '../cameras/cameraApi';

const reportIncidentSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  type: z.enum(['theft', 'vandalism', 'technical_issue', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  cameraId: z.string().optional(),
});

type ReportIncidentFormValues = z.infer<typeof reportIncidentSchema>;
type Props = NativeStackScreenProps<RootStackParamList, 'ReportIncident'>;

export const ReportIncidentScreen: React.FC<Props> = ({ navigation, route }) => {
  const preselectedCameraId = route.params?.preselectedCameraId;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [reportIncidentMutation, { isLoading }] = useReportIncidentMutation();
  const { data: camerasResponse } = useGetCamerasQuery();
  const cameras = camerasResponse?.data?.cameras || [];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportIncidentFormValues>({
    resolver: zodResolver(reportIncidentSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'theft',
      severity: 'medium',
      cameraId: preselectedCameraId || '',
    },
  });

  const selectedType = watch('type');
  const selectedSeverity = watch('severity');
  const selectedCameraId = watch('cameraId');

  const onSubmit = async (values: ReportIncidentFormValues) => {
    setErrorMessage(null);
    try {
      const response = await reportIncidentMutation({
        title: values.title.trim(),
        description: values.description.trim(),
        type: values.type,
        severity: values.severity,
        cameraId: values.cameraId || undefined,
      }).unwrap();

      const createdIncident = (response.data as any)?.incident || response.data;
      const incidentId = createdIncident._id || (response as any)._id;

      Alert.alert(
        'Incident Reported',
        `Incident #${(incidentId || '').slice(-6).toUpperCase()} has been submitted. Our security team will review it immediately.`,
        [
          {
            text: 'View Incident',
            onPress: () => {
              navigation.replace('IncidentDetail', {
                incidentId,
                incident: createdIncident,
              });
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('[ReportIncident] Error:', err);
      setErrorMessage(
        err.data?.message || err.message || 'Failed to submit incident report. Please try again.'
      );
    }
  };

  const incidentTypes: Array<{ key: ReportIncidentFormValues['type']; label: string }> = [
    { key: 'theft', label: 'Theft / Burglary' },
    { key: 'vandalism', label: 'Property Damage' },
    { key: 'technical_issue', label: 'Camera / Hardware' },
    { key: 'other', label: 'General Threat' },
  ];

  const severityLevels: Array<{
    key: ReportIncidentFormValues['severity'];
    label: string;
    color: string;
  }> = [
    { key: 'low', label: 'Low', color: COLORS.textMuted },
    { key: 'medium', label: 'Medium', color: COLORS.infoBlue },
    { key: 'high', label: 'High', color: COLORS.warningAmber },
    { key: 'critical', label: 'Critical', color: COLORS.sosRed },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Report an Incident</Text>
          <Text style={styles.subtitle}>
            Submit a security breach or incident report for review by your franchise & monitoring operators
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <HugeIcon icon={AlertCircleIcon} size={16} color={COLORS.sosRed} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          {/* Incident Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Incident Subject / Summary</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="e.g. Suspicious activity near front gate"
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isLoading}
                />
              )}
            />
            {errors.title ? (
              <Text style={styles.fieldErrorText}>{errors.title.message}</Text>
            ) : null}
          </View>

          {/* Incident Type Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Incident Classification</Text>
            <View style={styles.chipsGrid}>
              {incidentTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.chip,
                    selectedType === type.key && styles.chipActive,
                  ]}
                  onPress={() => setValue('type', type.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedType === type.key && styles.chipTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Severity Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Severity Level</Text>
            <View style={styles.chipsRow}>
              {severityLevels.map((sev) => (
                <TouchableOpacity
                  key={sev.key}
                  style={[
                    styles.severityChip,
                    selectedSeverity === sev.key && {
                      borderColor: sev.color,
                      backgroundColor: `${sev.color}20`,
                    },
                  ]}
                  onPress={() => setValue('severity', sev.key)}
                >
                  <Text
                    style={[
                      styles.severityChipText,
                      selectedSeverity === sev.key && styles.severityChipTextActive,
                      selectedSeverity === sev.key && { color: sev.color },
                    ]}
                  >
                    {sev.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CCTV Camera Linking */}
          {cameras.length > 0 ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Link CCTV Camera (Optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.camerasRow}
              >
                <TouchableOpacity
                  style={[
                    styles.cameraChip,
                    !selectedCameraId && styles.cameraChipActive,
                  ]}
                  onPress={() => setValue('cameraId', '')}
                >
                  <Text
                    style={[
                      styles.cameraChipText,
                      !selectedCameraId && styles.cameraChipTextActive,
                    ]}
                  >
                    No Specific Camera
                  </Text>
                </TouchableOpacity>

                {cameras.map((cam) => (
                  <TouchableOpacity
                    key={cam._id}
                    style={[
                      styles.cameraChip,
                      selectedCameraId === cam._id && styles.cameraChipActive,
                    ]}
                    onPress={() => setValue('cameraId', cam._id)}
                  >
                    <HugeIcon
                      icon={CctvCameraIcon}
                      size={14}
                      color={
                        selectedCameraId === cam._id
                          ? COLORS.textInverse
                          : COLORS.textMuted
                      }
                      style={styles.cameraIcon}
                    />
                    <Text
                      style={[
                        styles.cameraChipText,
                        selectedCameraId === cam._id && styles.cameraChipTextActive,
                      ]}
                    >
                      {cam.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Detailed Description of Event</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    errors.description && styles.inputError,
                  ]}
                  placeholder="Provide precise details, estimated time of occurrence, and any identifiable suspects or damages..."
                  placeholderTextColor={COLORS.textMuted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isLoading}
                />
              )}
            />
            {errors.description ? (
              <Text style={styles.fieldErrorText}>
                {errors.description.message}
              </Text>
            ) : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
            onPress={() => handleSubmit(onSubmit)()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Incident Report</Text>
            )}
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
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
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
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 18,
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
    marginLeft: SPACING.sm,
    flex: 1,
  },
  formCard: {
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
    fontWeight: '700',
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
  textArea: {
    minHeight: 100,
  },
  inputError: {
    borderColor: COLORS.sosRed,
  },
  fieldErrorText: {
    color: COLORS.sosRed,
    fontSize: 12,
    marginTop: 4,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADIUS.pill,
  },
  chipActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  severityChip: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  severityChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  severityChipTextActive: {
    fontWeight: '800',
  },
  camerasRow: {
    paddingVertical: 2,
  },
  cameraIcon: {
    marginRight: 4,
  },
  cameraChip: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADIUS.pill,
    marginRight: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cameraChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  cameraChipTextActive: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  submitButton: {
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
  submitButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
