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
  Clock01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useCreateTicketMutation } from './ticketsApi';

const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  category: z.enum(['technical', 'billing', 'general', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

type CreateTicketFormValues = z.infer<typeof createTicketSchema>;
type Props = NativeStackScreenProps<RootStackParamList, 'CreateTicket'>;

export const CreateTicketScreen: React.FC<Props> = ({ navigation }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createTicketMutation, { isLoading }] = useCreateTicketMutation();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'technical',
      priority: 'medium',
    },
  });

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');

  const onSubmit = async (values: CreateTicketFormValues) => {
    setErrorMessage(null);
    try {
      const response = await createTicketMutation({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        priority: values.priority,
      }).unwrap();

      const createdTicket = (response.data as any)?.ticket || response.data;
      const ticketId = createdTicket._id || (response as any)._id;

      Alert.alert(
        'Ticket Created',
        `Support ticket #${(ticketId || '').slice(-6).toUpperCase()} has been submitted. Our engineering team will reply within 24 hours.`,
        [
          {
            text: 'View Ticket Thread',
            onPress: () => {
              navigation.replace('TicketDetail', {
                ticketId,
                ticket: createdTicket,
              });
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('[CreateTicket] Error:', err);
      setErrorMessage(
        err.data?.message || err.message || 'Failed to submit support ticket. Please try again.'
      );
    }
  };

  const categories: Array<{ key: CreateTicketFormValues['category']; label: string }> = [
    { key: 'technical', label: 'Technical / Feed Issue' },
    { key: 'billing', label: 'Billing & Plans' },
    { key: 'general', label: 'Installation & Hardware' },
    { key: 'other', label: 'Other Inquiries' },
  ];

  const priorities: Array<{
    key: CreateTicketFormValues['priority'];
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
          <Text style={styles.title}>Open Support Ticket</Text>
          <Text style={styles.subtitle}>
            Reach out directly to your surveillance franchise team for technical assistance
          </Text>
        </View>

        {/* 24-hour SLA Promise Banner */}
        <View style={styles.slaBanner}>
          <HugeIcon icon={Clock01Icon} size={16} color={COLORS.primary} />
          <Text style={styles.slaText}>
            Guaranteed Response SLA: Our team typically replies within 24 hours.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <HugeIcon icon={AlertCircleIcon} size={16} color={COLORS.sosRed} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          {/* Ticket Subject */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Subject</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="e.g. Camera 2 offline after power outage"
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

          {/* Category Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.chipsGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.chip,
                    selectedCategory === cat.key && styles.chipActive,
                  ]}
                  onPress={() => setValue('category', cat.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === cat.key && styles.chipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Urgency / Priority</Text>
            <View style={styles.chipsRow}>
              {priorities.map((pri) => (
                <TouchableOpacity
                  key={pri.key}
                  style={[
                    styles.priorityChip,
                    selectedPriority === pri.key && {
                      borderColor: pri.color,
                      backgroundColor: `${pri.color}20`,
                    },
                  ]}
                  onPress={() => setValue('priority', pri.key)}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      selectedPriority === pri.key && styles.priorityChipTextActive,
                      selectedPriority === pri.key && { color: pri.color },
                    ]}
                  >
                    {pri.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Detailed Description</Text>
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
                  placeholder="Describe the issue in detail, error codes encountered, or questions regarding your subscription..."
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

          {/* Submit CTA */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
            onPress={() => handleSubmit(onSubmit)()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Ticket</Text>
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
    marginBottom: SPACING.md,
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
  slaBanner: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  slaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: SPACING.sm,
    flex: 1,
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
  priorityChip: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  priorityChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  priorityChipTextActive: {
    fontWeight: '800',
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
