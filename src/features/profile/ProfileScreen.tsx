import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  UserIcon,
  Logout01Icon,
  SirenIcon,
  ArrowRight01Icon,
  Shield01Icon,
  CustomerSupportIcon,
  Invoice01Icon,
  LockIcon,
  SmartPhone01Icon,
  InformationCircleIcon,
  Notification01Icon,
  CallIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../app/slices/authSlice';
import { clearTokens } from '../../utils/keychain';
import { useGetCustomerProfileQuery } from './profileApi';
import { getSocket } from '../../hooks/useSocket';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const { data: profileResponse } = useGetCustomerProfileQuery();

  const user = profileResponse?.data?.user || reduxUser;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          const socket = getSocket();
          if (socket) {
            socket.disconnect();
          }
          await clearTokens();
          dispatch(logout());
        },
      },
    ]);
  };

  const handleCallFranchise = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Customer'}</Text>
        <Text style={styles.email}>{user?.email || 'customer@example.com'}</Text>
        {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>CUSTOMER</Text>
        </View>
      </View>

      {/* Franchise Support Card (If linked) */}
      {user?.franchiseId ? (
        <View style={styles.franchiseCard}>
          <View style={styles.franchiseIconBox}>
            <HugeIcon icon={CustomerSupportIcon} size={20} color={COLORS.primary} />
          </View>
          <View style={styles.franchiseContent}>
            <Text style={styles.franchiseLabel}>Assigned Franchise Support</Text>
            <Text style={styles.franchiseName}>{user.franchiseId.name}</Text>
            {user.franchiseId.phone ? (
              <Text style={styles.franchisePhone}>{user.franchiseId.phone}</Text>
            ) : null}
          </View>
          {user.franchiseId.phone ? (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => handleCallFranchise(user.franchiseId?.phone)}
            >
              <HugeIcon icon={CallIcon} size={16} color={COLORS.textInverse} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Group 1: Personal & Preferences */}
      <Text style={styles.sectionHeader}>Preferences & Profile</Text>
      <View style={styles.menuSection}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItem}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: `${COLORS.primary}15` }]}>
            <HugeIcon icon={UserIcon} size={18} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Edit Profile</Text>
            <Text style={styles.menuSubtitle}>Name, mobile, address, emergency contact</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItem}
          onPress={() => navigation.navigate('NotifPreferences')}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: `${COLORS.secondary}15` }]}>
            <HugeIcon icon={Notification01Icon} size={18} color={COLORS.secondary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Notification Preferences</Text>
            <Text style={styles.menuSubtitle}>Push, in-app, and email alert toggles</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Group 2: Security & Devices */}
      <Text style={styles.sectionHeader}>Security & Devices</Text>
      <View style={styles.menuSection}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItem}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: `${COLORS.primary}15` }]}>
            <HugeIcon icon={LockIcon} size={18} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Change Password</Text>
            <Text style={styles.menuSubtitle}>Update account login password</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItem}
          onPress={() => navigation.navigate('Sessions')}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: `${COLORS.warning}15` }]}>
            <HugeIcon icon={SmartPhone01Icon} size={18} color={COLORS.warning} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Active Device Sessions</Text>
            <Text style={styles.menuSubtitle}>Manage signed-in devices & mass revoke</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Group 3: History & Activity */}
      <Text style={styles.sectionHeader}>Activity & Records</Text>
      <View style={styles.menuSection}>
        {/* Incident Reports */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItem}
          onPress={() => navigation.navigate('IncidentList')}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: `${COLORS.primary}15` }]}>
            <HugeIcon icon={Shield01Icon} size={18} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>My Incident Reports</Text>
            <Text style={styles.menuSubtitle}>View filed incident breaches & notes</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* SOS Emergency */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItem}
          onPress={() => navigation.navigate('SOSHistory')}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: `${COLORS.error}15` }]}>
            <HugeIcon icon={SirenIcon} size={18} color={COLORS.error} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Emergency SOS History</Text>
            <Text style={styles.menuSubtitle}>View past emergency logs & dispatches</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* Support Tickets */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItem}
          onPress={() => navigation.navigate('TicketList')}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: `${COLORS.info}15` }]}>
            <HugeIcon icon={CustomerSupportIcon} size={18} color={COLORS.info} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Support Tickets</Text>
            <Text style={styles.menuSubtitle}>Direct assistance from support engineers</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* Invoices */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItem}
          onPress={() => navigation.navigate('InvoiceList')}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: `${COLORS.warning}15` }]}>
            <HugeIcon icon={Invoice01Icon} size={18} color={COLORS.warning} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Invoices & Statements</Text>
            <Text style={styles.menuSubtitle}>Download PDF payment receipts</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Group 4: About & Legal */}
      <Text style={styles.sectionHeader}>Application</Text>
      <View style={styles.menuSection}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.menuItem}
          onPress={() => navigation.navigate('About')}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: `${COLORS.textSecondary}15` }]}>
            <HugeIcon icon={InformationCircleIcon} size={18} color={COLORS.textSecondary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>About & Legal</Text>
            <Text style={styles.menuSubtitle}>Version 0.0.1, terms, privacy policy</Text>
          </View>
          <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sign Out CTA */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <HugeIcon icon={Logout01Icon} size={18} color={COLORS.error} />
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
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: `${COLORS.primary}18`,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  name: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  email: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  phone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginTop: SPACING.sm,
  },
  roleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 10,
  },
  franchiseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  franchiseIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  franchiseContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  franchiseLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  franchiseName: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.textPrimary,
  },
  franchisePhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  callBtn: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 18,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  menuTitle: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 56,
  },
  logoutButton: {
    backgroundColor: `${COLORS.error}12`,
    borderWidth: 1,
    borderColor: `${COLORS.error}30`,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 15,
  },
});
