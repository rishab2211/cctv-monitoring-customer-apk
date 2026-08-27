import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import {
  SirenIcon,
  ArrowRight01Icon,
  CctvCameraIcon,
  PlayIcon,
  Building03Icon,
  Call02Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { StatusBadge } from '../../components/StatusBadge';
import { useGetDashboardQuery } from './dashboardApi';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { SubscriptionPaywallModal } from '../../components/SubscriptionPaywallModal';
import { useAppSelector } from '../../hooks/redux';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAppSelector((state) => state.auth.user);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const { data: dashboardResponse, isLoading, isFetching, refetch } = useGetDashboardQuery();
  const dashboard = dashboardResponse?.data;

  const subscriptionStatus = dashboard?.subscription?.status || 'active';
  const { canStream, paywallType } = useSubscriptionGuard({
    statusOverride: subscriptionStatus,
  });

  const handleWatchLive = (cameraId: string, cameraName: string, isOwner: boolean = true) => {
    if (canStream) {
      navigation.navigate('LiveView', { cameraId, cameraName, isOwner });
    } else {
      setPaywallVisible(true);
    }
  };

  const handleFranchiseCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Welcome & Profile Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{dashboard?.customer?.name || user?.name || 'Customer'}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'TabProfile' })}
          >
            <Text style={styles.avatarLetter}>
              {(dashboard?.customer?.name || user?.name || 'C')[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active SOS Emergency Banner (Conditional) */}
        {dashboard?.activeSosAlerts && dashboard.activeSosAlerts.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.sosAlertBanner}
            onPress={() =>
              navigation.navigate('SOSDetail', {
                sosId: dashboard.activeSosAlerts[0]._id,
                alert: dashboard.activeSosAlerts[0],
              })
            }
          >
            <View style={styles.sosIconBox}>
              <HugeIcon icon={SirenIcon} size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={styles.sosAlertContent}>
              <Text style={styles.sosAlertTitle}>ACTIVE SOS ALERT</Text>
              <Text style={styles.sosAlertDesc}>
                Emergency response team has been alerted. Tap to view live dispatch timeline.
              </Text>
            </View>
            <HugeIcon icon={ArrowRight01Icon} size={20} color={COLORS.sosRed} />
          </TouchableOpacity>
        ) : null}

        {/* Subscription Status Banner */}
        {dashboard?.subscription ? (
          <View
            style={[
              styles.subscriptionCard,
              dashboard.subscription.status === 'past_due' && styles.subscriptionPastDue,
              dashboard.subscription.status === 'canceled' && styles.subscriptionCanceled,
            ]}
          >
            <View style={styles.subscriptionHeader}>
              <View>
                <Text style={styles.subscriptionPlan}>
                  {dashboard.subscription.planName || 'Standard Security'} Plan
                </Text>
                <Text style={styles.subscriptionDate}>
                  {dashboard.subscription.status === 'active'
                    ? `Valid until ${new Date(dashboard.subscription.endDate).toLocaleDateString()}`
                    : 'Action required to restore full surveillance'}
                </Text>
              </View>
              <StatusBadge status={dashboard.subscription.status} />
            </View>

            {dashboard.subscription.status !== 'active' ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.payNowButton}
                onPress={() => navigation.navigate('MainTabs', { screen: 'TabBilling' })}
              >
                <Text style={styles.payNowText}>
                  {dashboard.subscription.status === 'past_due' ? 'Pay Pending Invoice' : 'Upgrade Plan'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Camera Health Quick Stats */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', { screen: 'TabCameras' })}
          >
            <Text style={styles.sectionLink}>View All Feeds</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, styles.statCardOnline]}
            onPress={() => navigation.navigate('CameraList', { filter: 'online' })}
          >
            <Text style={[styles.statValue, { color: COLORS.successGreen }]}>
              {dashboard?.cameraStats?.online ?? 0}
            </Text>
            <Text style={styles.statLabel}>Online</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.statCardOffline]}
            onPress={() => navigation.navigate('CameraList', { filter: 'offline' })}
          >
            <Text style={[styles.statValue, { color: COLORS.sosRed }]}>
              {dashboard?.cameraStats?.offline ?? 0}
            </Text>
            <Text style={styles.statLabel}>Offline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.statCardMaintenance]}
            onPress={() => navigation.navigate('CameraList', { filter: 'all' })}
          >
            <Text style={[styles.statValue, { color: COLORS.infoBlue }]}>
              {dashboard?.cameraStats?.maintenance ?? 0}
            </Text>
            <Text style={styles.statLabel}>Maintenance</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Access Cameras Carousel */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Live Feeds</Text>
          <Text style={styles.sectionSubtext}>
            {dashboard?.cameras?.length || 0} Connected
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : dashboard?.cameras && dashboard.cameras.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.camerasHorizontalScroll}
          >
            {dashboard.cameras.slice(0, 5).map((camera) => (
              <View key={camera._id} style={styles.cameraFeedCard}>
                <View style={styles.cameraFeedHeader}>
                  <View style={{ flex: 1, marginRight: SPACING.sm }}>
                    <Text style={styles.cameraFeedName} numberOfLines={1}>
                      {camera.name}
                    </Text>
                    <Text style={styles.cameraFeedLocation} numberOfLines={1}>
                      {camera.location?.address || 'Premises'}
                    </Text>
                  </View>
                  <StatusBadge status={camera.status} size="small" />
                </View>

                {/* Video Thumbnail Placeholder */}
                <View style={styles.cameraPreviewBox}>
                  <HugeIcon icon={CctvCameraIcon} size={36} color={COLORS.textMuted} />
                  {camera.isOwner === false ? (
                    <View style={styles.sharedBadge}>
                      <Text style={styles.sharedBadgeText}>SHARED</Text>
                    </View>
                  ) : null}
                </View>

                {/* Action Buttons */}
                <View style={styles.cameraFeedActions}>
                  <TouchableOpacity
                    style={styles.watchLiveBtn}
                    onPress={() =>
                      handleWatchLive(camera._id, camera.name, camera.isOwner !== false)
                    }
                  >
                    <HugeIcon icon={PlayIcon} size={14} color={COLORS.textInverse} />
                    <Text style={styles.watchLiveBtnText}>Watch Live</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => navigation.navigate('CameraDetail', { camera, cameraId: camera._id })}
                  >
                    <Text style={styles.detailsBtnText}>Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyCamerasBox}>
            <HugeIcon icon={CctvCameraIcon} size={48} color={COLORS.textMuted} style={{ marginBottom: SPACING.sm }} />
            <Text style={styles.emptyCamerasTitle}>No Cameras Configured</Text>
            <Text style={styles.emptyCamerasDesc}>
              Contact your local security franchise to install and configure CCTV units.
            </Text>
          </View>
        )}

        {/* Franchise / Security Partner Contact Card */}
        {dashboard?.customer?.franchiseContact ? (
          <View style={styles.franchiseCard}>
            <View style={styles.franchiseIconBox}>
              <HugeIcon icon={Building03Icon} size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.franchiseLabel}>Assigned Security Franchise</Text>
              <Text style={styles.franchiseName}>
                {dashboard.customer.franchiseContact.name}
              </Text>
            </View>
            {dashboard.customer.franchiseContact.phone ? (
              <TouchableOpacity
                style={styles.callFranchiseBtn}
                onPress={() => handleFranchiseCall(dashboard.customer?.franchiseContact?.phone)}
              >
                <HugeIcon icon={Call02Icon} size={14} color={COLORS.primary} />
                <Text style={styles.callFranchiseText}>Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Subscription Paywall Gate Modal */}
      <SubscriptionPaywallModal
        visible={paywallVisible}
        type={paywallType}
        onClose={() => setPaywallVisible(false)}
        onNavigateBilling={() => navigation.navigate('MainTabs', { screen: 'TabBilling' })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
  },
  userName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  sosAlertBanner: {
    backgroundColor: COLORS.sosRedMuted,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.sosRed,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.glowSos,
  },
  sosIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.sosRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  sosIconText: {
    fontSize: 18,
  },
  sosAlertContent: {
    flex: 1,
  },
  sosAlertTitle: {
    color: COLORS.sosRed,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosAlertDesc: {
    color: '#FFCDD2',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  chevron: {
    color: COLORS.sosRed,
    fontSize: 18,
    marginLeft: SPACING.sm,
  },
  subscriptionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    marginBottom: SPACING.xl,
  },
  subscriptionPastDue: {
    borderColor: COLORS.warningAmber,
    backgroundColor: 'rgba(255, 159, 10, 0.08)',
  },
  subscriptionCanceled: {
    borderColor: COLORS.sosRed,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionPlan: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  subscriptionDate: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  payNowButton: {
    backgroundColor: COLORS.warningAmber,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  payNowText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 17,
  },
  sectionLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
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
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardOnline: {
    borderColor: 'rgba(48, 209, 88, 0.25)',
  },
  statCardOffline: {
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  statCardMaintenance: {
    borderColor: 'rgba(10, 132, 255, 0.25)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  camerasHorizontalScroll: {
    paddingBottom: SPACING.lg,
  },
  cameraFeedCard: {
    width: 250,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.md,
  },
  cameraFeedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  cameraFeedName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cameraFeedLocation: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cameraPreviewBox: {
    height: 120,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  cameraPreviewIcon: {
    fontSize: 32,
    opacity: 0.6,
  },
  sharedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.infoBlueMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.infoBlue,
  },
  sharedBadgeText: {
    color: COLORS.infoBlue,
    fontSize: 9,
    fontWeight: '800',
  },
  cameraFeedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  watchLiveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.xs + 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  watchLiveBtnText: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  detailsBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.button,
    alignItems: 'center',
  },
  detailsBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyCamerasBox: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  emptyCamerasTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  emptyCamerasDesc: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  franchiseCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  franchiseIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  franchiseLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  franchiseName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  callFranchiseBtn: {
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callFranchiseText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
});
