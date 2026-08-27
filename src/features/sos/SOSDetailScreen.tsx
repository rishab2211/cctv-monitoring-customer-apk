import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  SirenIcon,
  Location01Icon,
  CctvCameraIcon,
  Call02Icon,
  PlayIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useGetSOSDetailQuery, useGetSOSTimelineQuery } from './sosApi';
import { useGetCamerasQuery } from '../cameras/cameraApi';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { SubscriptionPaywallModal } from '../../components/SubscriptionPaywallModal';
import { useAppSelector } from '../../hooks/redux';

type Props = NativeStackScreenProps<RootStackParamList, 'SOSDetail'>;

export const SOSDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sosId, alert: initialAlert } = route.params;
  const user = useAppSelector((state) => state.auth.user);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const {
    data: detailResponse,
    isLoading: isLoadingDetail,
    isFetching: isFetchingDetail,
    refetch: refetchDetail,
  } = useGetSOSDetailQuery(sosId);

  const {
    data: timelineResponse,
    isLoading: isLoadingTimeline,
    refetch: refetchTimeline,
  } = useGetSOSTimelineQuery(sosId);

  const { data: camerasResponse } = useGetCamerasQuery();
  const cameras = camerasResponse?.data?.cameras || [];

  const alert = detailResponse?.data || initialAlert;
  const timeline = timelineResponse?.data?.timeline || [];

  const { canStream } = useSubscriptionGuard();

  const handleRefresh = () => {
    refetchDetail();
    refetchTimeline();
  };

  const handleCallEmergencyContact = () => {
    const contactPhone =
      user?.emergencyContact?.phone || user?.franchiseId?.phone;
    if (contactPhone) {
      Linking.openURL(`tel:${contactPhone}`);
    } else {
      Linking.openURL('tel:112');
    }
  };

  const handleWatchCamera = (cameraId: string, cameraName: string) => {
    if (canStream) {
      navigation.navigate('LiveView', { cameraId, cameraName });
    } else {
      setPaywallVisible(true);
    }
  };

  if (isLoadingDetail && !alert) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingSubtext}>Loading emergency dispatch details...</Text>
      </View>
    );
  }

  if (!alert) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>SOS Alert record not found or access expired.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cameraObj =
    typeof alert.cameraId === 'object' && alert.cameraId !== null
      ? alert.cameraId
      : typeof alert.cameraId === 'string'
      ? cameras.find((c) => c._id === alert.cameraId)
      : undefined;

  const triggeredDate = new Date(alert.createdAt).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetchingDetail}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Status Card Header */}
        <View
          style={[
            styles.statusHeroCard,
            alert.status === 'active' && styles.statusHeroCardActive,
            alert.status === 'acknowledged' && styles.statusHeroCardAck,
            alert.status === 'resolved' && styles.statusHeroCardResolved,
          ]}
        >
          <View style={styles.statusHeroHeader}>
            <View style={styles.statusIconBox}>
              <HugeIcon
                icon={
                  alert.status === 'resolved'
                    ? CheckmarkCircle01Icon
                    : SirenIcon
                }
                size={28}
                color={
                  alert.status === 'resolved'
                    ? COLORS.successGreen
                    : alert.status === 'acknowledged'
                    ? COLORS.warningAmber
                    : COLORS.sosRed
                }
              />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.statusHeroTitle}>
                {alert.status === 'active'
                  ? 'EMERGENCY DISPATCH ACTIVE'
                  : alert.status === 'acknowledged'
                  ? 'RESPONDER ACKNOWLEDGED'
                  : alert.status === 'resolved'
                  ? 'EMERGENCY RESOLVED'
                  : 'FALSE ALARM RECORDED'}
              </Text>
              <Text style={styles.statusHeroSubtitle}>
                Alert ID: #{alert._id.slice(-8).toUpperCase()} • {triggeredDate}
              </Text>
            </View>
          </View>

          {/* Quick Call Direct Dispatcher */}
          <TouchableOpacity
            style={styles.callDispatcherBtn}
            onPress={handleCallEmergencyContact}
          >
            <HugeIcon icon={Call02Icon} size={16} color="#FFFFFF" />
            <Text style={styles.callDispatcherText}>
              {user?.emergencyContact?.phone
                ? `Call Emergency Contact (${user.emergencyContact.name})`
                : 'Call Emergency Responder'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location & GPS Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Broadcast Location</Text>
          <View style={styles.locationRow}>
            <HugeIcon icon={Location01Icon} size={20} color={COLORS.sosRed} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.locationAddress}>
                {typeof alert.location === 'string'
                  ? alert.location
                  : alert.location?.address || 'Premises Coordinates'}
              </Text>
              {typeof alert.location === 'object' && alert.location?.latitude && alert.location?.longitude ? (
                <Text style={styles.locationCoords}>
                  GPS: {alert.location.latitude.toFixed(5)}, {alert.location.longitude.toFixed(5)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Associated Camera Card (If linked) */}
        {cameraObj ? (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Associated CCTV Camera</Text>
            <View style={styles.cameraRow}>
              <View style={styles.cameraIconBox}>
                <HugeIcon icon={CctvCameraIcon} size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.cameraName}>{cameraObj.name}</Text>
                <Text style={styles.cameraSerial}>
                  SN: {cameraObj.serialNumber || cameraObj._id}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.watchLiveBtn}
                onPress={() => handleWatchCamera(cameraObj._id, cameraObj.name)}
              >
                <HugeIcon icon={PlayIcon} size={14} color={COLORS.textInverse} />
                <Text style={styles.watchLiveText}>Live Feed</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Vertical Dispatch Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Incident Response Timeline</Text>

          <View style={styles.timelineContainer}>
            {/* Step 1: Triggered */}
            <View style={styles.timelineStep}>
              <View style={[styles.timelineNode, styles.timelineNodeDone]}>
                <HugeIcon icon={SirenIcon} size={14} color="#FFFFFF" />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineStepHeader}>
                  <Text style={styles.timelineStepTitle}>SOS Triggered</Text>
                  <Text style={styles.timelineStepTime}>{triggeredDate}</Text>
                </View>
                <Text style={styles.timelineStepDesc}>
                  Emergency signal broadcasted to security command center and emergency contacts.
                </Text>
              </View>
            </View>

            {/* Step 2: Acknowledged */}
            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineNode,
                  alert.status !== 'active' ? styles.timelineNodeDone : styles.timelineNodePending,
                ]}
              >
                <HugeIcon
                  icon={UserIcon}
                  size={14}
                  color={alert.status !== 'active' ? '#FFFFFF' : COLORS.textMuted}
                />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineStepHeader}>
                  <Text style={styles.timelineStepTitle}>Security Dispatch Acknowledged</Text>
                  {alert.acknowledgedAt ? (
                    <Text style={styles.timelineStepTime}>
                      {new Date(alert.acknowledgedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.timelineStepDesc}>
                  {alert.acknowledgedAt
                    ? `Acknowledged by ${
                        typeof alert.acknowledgedBy === 'object' && alert.acknowledgedBy !== null
                          ? alert.acknowledgedBy.name
                          : 'Monitoring Operator'
                      }. Dispatch protocols activated.`
                    : 'Awaiting operator acknowledgment...'}
                </Text>
              </View>
            </View>

            {/* Step 3: Resolved */}
            <View style={[styles.timelineStep, { borderLeftWidth: 0 }]}>
              <View
                style={[
                  styles.timelineNode,
                  alert.status === 'resolved' || alert.status === 'false_alarm'
                    ? styles.timelineNodeDone
                    : styles.timelineNodePending,
                ]}
              >
                <HugeIcon
                  icon={CheckmarkCircle01Icon}
                  size={14}
                  color={
                    alert.status === 'resolved' || alert.status === 'false_alarm'
                      ? '#FFFFFF'
                      : COLORS.textMuted
                  }
                />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineStepHeader}>
                  <Text style={styles.timelineStepTitle}>
                    {alert.status === 'false_alarm' ? 'Closed as False Alarm' : 'Resolved & Secured'}
                  </Text>
                  {alert.resolvedAt ? (
                    <Text style={styles.timelineStepTime}>
                      {new Date(alert.resolvedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.timelineStepDesc}>
                  {alert.resolvedAt
                    ? alert.resolutionNotes ||
                      `Incident verified and closed by ${
                        typeof alert.resolvedBy === 'object' && alert.resolvedBy !== null
                          ? alert.resolvedBy.name
                          : 'Field Team'
                      }.`
                    : 'Resolution pending on-site verification.'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Audit Log (If available) */}
        {timeline.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Audit Log Entries ({timeline.length})</Text>
            {timeline.map((item) => (
              <View key={item._id} style={styles.auditRow}>
                <Text style={styles.auditAction}>{item.action.toUpperCase().replace('_', ' ')}</Text>
                <Text style={styles.auditUser}>
                  {item.performedBy?.name || 'System Operator'} • {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
                {item.notes ? <Text style={styles.auditNotes}>{item.notes}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <SubscriptionPaywallModal
        visible={paywallVisible}
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
    paddingBottom: 40,
  },
  statusHeroCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  statusHeroCardActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderColor: COLORS.sosRed,
    ...SHADOWS.glowSos,
  },
  statusHeroCardAck: {
    backgroundColor: 'rgba(255, 159, 10, 0.08)',
    borderColor: COLORS.warningAmber,
  },
  statusHeroCardResolved: {
    backgroundColor: 'rgba(48, 209, 88, 0.08)',
    borderColor: COLORS.successGreen,
  },
  statusHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusHeroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  statusHeroSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  callDispatcherBtn: {
    backgroundColor: COLORS.sosRed,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glowSos,
  },
  callDispatcherText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: SPACING.xs + 2,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardSectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationAddress: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  locationCoords: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cameraSerial: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  watchLiveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchLiveText: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  timelineContainer: {
    paddingLeft: SPACING.xs,
  },
  timelineStep: {
    flexDirection: 'row',
    borderLeftWidth: 2,
    borderLeftColor: COLORS.borderHighlight,
    paddingLeft: SPACING.lg,
    paddingBottom: SPACING.xl,
    position: 'relative',
  },
  timelineNode: {
    position: 'absolute',
    left: -13,
    top: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeDone: {
    backgroundColor: COLORS.primary,
  },
  timelineNodePending: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timelineStepTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  timelineStepDesc: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  auditRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  auditAction: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '800',
  },
  auditUser: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  auditNotes: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  loadingSubtext: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.sosRed,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.button,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});
