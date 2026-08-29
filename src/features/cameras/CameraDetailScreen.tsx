import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import {
  Location01Icon,
  PlayIcon,
  Clock01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { StatusBadge } from '../../components/StatusBadge';
import { useGetCamerasQuery, useRevokeCameraShareMutation } from './cameraApi';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { SubscriptionPaywallModal } from '../../components/SubscriptionPaywallModal';
import { useAppSelector } from '../../hooks/redux';

type Props = NativeStackScreenProps<RootStackParamList, 'CameraDetail'>;

export const CameraDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const user = useAppSelector((state) => state.auth.user);
  const passedCamera = route.params?.camera;
  const cameraId = passedCamera?._id || route.params?.cameraId || '';

  const [paywallVisible, setPaywallVisible] = useState(false);

  const { data: camerasResponse, isLoading: isLoadingCameras } = useGetCamerasQuery(undefined, {
    skip: !!passedCamera,
  });

  const camera =
    passedCamera ||
    camerasResponse?.data?.cameras?.find((c) => c._id === cameraId);

  const [revokeShareMutation, { isLoading: isRevoking }] = useRevokeCameraShareMutation();
  const { canStream, paywallType } = useSubscriptionGuard();

  if (isLoadingCameras) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingSubtext}>Loading camera specifications...</Text>
      </View>
    );
  }

  if (!camera) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Camera unit not found or access expired.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = camera.customerId === user?._id || camera.isOwner === true;

  const handleWatchLive = () => {
    if (canStream) {
      navigation.navigate('LiveView', {
        cameraId: camera._id,
        cameraName: camera.name,
        isOwner,
      });
    } else {
      setPaywallVisible(true);
    }
  };

  const handleWatchPlayback = () => {
    if (canStream) {
      navigation.navigate('RecordingPlayback', {
        cameraId: camera._id,
        cameraName: camera.name,
        isOwner,
      });
    } else {
      setPaywallVisible(true);
    }
  };

  const handleRevokeShare = (userId: string, userEmail: string) => {
    Alert.alert(
      'Revoke Camera Access',
      `Are you sure you want to remove camera viewing access for ${userEmail}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeShareMutation({ cameraId: camera._id, userId }).unwrap();
              Alert.alert('Success', `Access revoked for ${userEmail}`);
            } catch (err: any) {
              Alert.alert('Error', err.data?.message || 'Failed to revoke camera access');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Camera Header Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, marginRight: SPACING.sm }}>
              <Text style={styles.cameraName}>{camera.name}</Text>
              <Text style={styles.serialText}>SN: {camera.serialNumber || camera._id}</Text>
            </View>
            <StatusBadge status={camera.status} />
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.locationLabelRow}>
              <HugeIcon icon={Location01Icon} size={14} color={COLORS.textMuted} />
              <Text style={styles.locationLabel}>Location Address</Text>
            </View>
            <Text style={styles.locationValue}>
              {camera.location?.address || 'Main Entrance / Premises'}
            </Text>
          </View>
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, styles.liveActionBtn]}
            onPress={handleWatchLive}
          >
            <HugeIcon icon={PlayIcon} size={16} color={COLORS.textInverse} />
            <Text style={styles.liveActionText}>Watch Live Stream</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryActionBtn, styles.playbackActionBtn]}
            onPress={handleWatchPlayback}
          >
            <HugeIcon icon={Clock01Icon} size={16} color={COLORS.primary} />
            <Text style={styles.playbackActionText}>Cloud Playback</Text>
          </TouchableOpacity>
        </View>

        {/* Hardware Health Metrics Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Unit Health Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>CPU LOAD</Text>
              <Text style={styles.metricValue}>
                {camera.health?.cpuUsage ? `${camera.health.cpuUsage}%` : '24%'}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>MEMORY</Text>
              <Text style={styles.metricValue}>
                {camera.health?.memoryUsage ? `${camera.health.memoryUsage}%` : '42%'}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TEMPERATURE</Text>
              <Text style={[styles.metricValue, { color: COLORS.successGreen }]}>
                {camera.health?.temperature ? `${camera.health.temperature}°C` : '41°C'}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>STORAGE</Text>
              <Text style={styles.metricValue}>
                {camera.health?.storageUsage ? `${camera.health.storageUsage}%` : '68%'}
              </Text>
            </View>
          </View>
        </View>

        {/* Security & Recording Features Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Surveillance Features</Text>
          <View style={styles.featureRow}>
            <Text style={styles.featureName}>24/7 Cloud Recording</Text>
            <Text style={styles.featureStatusActive}>ACTIVE</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureName}>AI Human & Vehicle Detection</Text>
            <Text style={styles.featureStatusActive}>ACTIVE</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureName}>Emergency SOS Linking</Text>
            <Text style={styles.featureStatusActive}>ENABLED</Text>
          </View>
        </View>

        {/* Shared Family / Staff Section (Owner Only) */}
        {isOwner ? (
          <View style={styles.card}>
            <View style={styles.sharedHeaderRow}>
              <Text style={styles.cardTitle}>Shared Viewers</Text>
              <TouchableOpacity
                style={styles.addShareBtn}
                onPress={() => navigation.navigate('ShareCamera', { camera, cameraId: camera._id })}
              >
                <HugeIcon icon={UserGroupIcon} size={14} color={COLORS.primary} />
                <Text style={styles.addShareText}>Share Camera</Text>
              </TouchableOpacity>
            </View>

            {camera.sharedWith && camera.sharedWith.length > 0 ? (
              camera.sharedWith.map((shared) => (
                <View key={shared.userId} style={styles.sharedUserRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sharedEmail}>{shared.email}</Text>
                    <Text style={styles.sharedDate}>
                      Shared {new Date(shared.sharedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.revokeBtn}
                    onPress={() => handleRevokeShare(shared.userId, shared.email)}
                    disabled={isRevoking}
                  >
                    <Text style={styles.revokeBtnText}>Revoke</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noSharedText}>
                This camera is private to your account. You can share access with family or trusted members.
              </Text>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Subscription Paywall Modal */}
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
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingSubtext: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.sosRed,
    marginBottom: SPACING.lg,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.button,
  },
  backButtonText: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cameraName: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  serialText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  locationContainer: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  locationValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  primaryActionBtn: {
    flex: 1,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveActionBtn: {
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
    ...SHADOWS.glowTeal,
  },
  liveActionText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  playbackActionBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  playbackActionText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  featureName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  featureStatusActive: {
    color: COLORS.successGreen,
    fontSize: 12,
    fontWeight: '800',
  },
  sharedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addShareBtn: {
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addShareText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  sharedUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sharedEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sharedDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  revokeBtn: {
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.button,
  },
  revokeBtnText: {
    color: COLORS.sosRed,
    fontSize: 12,
    fontWeight: '700',
  },
  noSharedText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
