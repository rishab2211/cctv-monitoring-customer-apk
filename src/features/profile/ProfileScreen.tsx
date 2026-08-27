import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Logout01Icon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../app/slices/authSlice';
import { clearTokens } from '../../utils/keychain';

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = async () => {
    await clearTokens();
    dispatch(logout());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Account Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Customer Name'}</Text>
        <Text style={styles.email}>{user?.email || 'customer@example.com'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>CUSTOMER</Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <HugeIcon icon={Logout01Icon} size={18} color={COLORS.sosRed} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
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
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  name: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  email: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  roleBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: COLORS.sosRed,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: SPACING.xs + 2,
  },
});
