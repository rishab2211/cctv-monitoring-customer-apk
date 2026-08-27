import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Logout01Icon,
  SirenIcon,
  ArrowRight01Icon,
  Shield01Icon,
  CustomerSupportIcon,
  Invoice01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../app/slices/authSlice';
import { clearTokens } from '../../utils/keychain';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

      {/* Profile Navigation Menu Options */}
      <View style={styles.menuSection}>
        {/* Incident Reports */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.menuItem}
          onPress={() => navigation.navigate('IncidentList')}
        >
          <View style={styles.menuIconCircle}>
            <HugeIcon icon={Shield01Icon} size={18} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>My Incident Reports</Text>
            <Text style={styles.menuSubtitle}>View filed incident breaches & notes</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* Support Tickets */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.menuItem}
          onPress={() => navigation.navigate('TicketList')}
        >
          <View style={styles.menuIconCircle}>
            <HugeIcon icon={CustomerSupportIcon} size={18} color={COLORS.infoBlue} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Support Tickets</Text>
            <Text style={styles.menuSubtitle}>Get direct assistance from franchise</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* Invoices */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.menuItem}
          onPress={() => navigation.navigate('InvoiceList')}
        >
          <View style={styles.menuIconCircle}>
            <HugeIcon icon={Invoice01Icon} size={18} color={COLORS.warningAmber} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Invoices & Statements</Text>
            <Text style={styles.menuSubtitle}>Download PDF payment receipts</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* SOS Emergency */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.menuItem}
          onPress={() => navigation.navigate('SOSHistory')}
        >
          <View style={styles.menuIconCircle}>
            <HugeIcon icon={SirenIcon} size={18} color={COLORS.sosRed} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Emergency SOS History</Text>
            <Text style={styles.menuSubtitle}>View past emergency logs & dispatches</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
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
  menuSection: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 56,
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
