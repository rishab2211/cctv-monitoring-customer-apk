import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';

export const BillingScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Subscription & Plans</Text>
      <Text style={styles.subtitle}>Manage your CCTV cloud storage & monitoring</Text>

      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.planName}>Premium Plan</Text>
          <StatusBadge status="active" />
        </View>
        <Text style={styles.price}>₹1,999 / mo</Text>
        <Text style={styles.description}>
          Includes 30 days cloud recording, 24/7 AI threat alerts & priority SOS.
        </Text>
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
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  planName: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.primary,
  },
  price: {
    ...TYPOGRAPHY.h1,
    fontSize: 26,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
  },
});
