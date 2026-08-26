import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';
import { useAppSelector } from '../../hooks/redux';

export const DashboardScreen: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
        </View>
        <StatusBadge status="active" label="PREMIUM" />
      </View>

      {/* Camera Health Quick Stats */}
      <Text style={styles.sectionTitle}>System Health</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.successGreen }]}>4</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.sosRed }]}>0</Text>
          <Text style={styles.statLabel}>Offline</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.infoBlue }]}>0</Text>
          <Text style={styles.statLabel}>Maintenance</Text>
        </View>
      </View>

      {/* Security Status Box */}
      <View style={styles.securityBox}>
        <View style={styles.securityHeader}>
          <Text style={styles.securityIcon}>🛡️</Text>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.securityTitle}>Premises Protected</Text>
            <Text style={styles.securitySubtitle}>
              All active surveillance systems operating normally
            </Text>
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greeting: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
  },
  userName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  securityBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityIcon: {
    fontSize: 32,
  },
  securityTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontSize: 16,
  },
  securitySubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
