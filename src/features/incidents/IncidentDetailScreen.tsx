import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Shield01Icon,
  CctvCameraIcon,
  PlayIcon,
  Clock01Icon,
  Comment01Icon,
  SentIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import {
  useGetIncidentDetailQuery,
  useGetIncidentTimelineQuery,
  useAddIncidentNoteMutation,
} from './incidentsApi';
import { useGetCamerasQuery } from '../cameras/cameraApi';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { SubscriptionPaywallModal } from '../../components/SubscriptionPaywallModal';
import { useAppSelector } from '../../hooks/redux';

type Props = NativeStackScreenProps<RootStackParamList, 'IncidentDetail'>;

export const IncidentDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { incidentId, incident: initialIncident } = route.params;
  const user = useAppSelector((state) => state.auth.user);
  const [newNote, setNewNote] = useState('');
  const [paywallVisible, setPaywallVisible] = useState(false);

  const {
    data: detailResponse,
    isLoading: isLoadingDetail,
    isFetching: isFetchingDetail,
    refetch: refetchDetail,
  } = useGetIncidentDetailQuery(incidentId);

  const {
    data: timelineResponse,
    isLoading: isLoadingTimeline,
    refetch: refetchTimeline,
  } = useGetIncidentTimelineQuery(incidentId);

  const { data: camerasResponse } = useGetCamerasQuery();
  const cameras = camerasResponse?.data?.cameras || [];

  const [addNoteMutation, { isLoading: isAddingNote }] = useAddIncidentNoteMutation();
  const { canStream } = useSubscriptionGuard();

  const incident = (detailResponse?.data as any)?.incident || detailResponse?.data || initialIncident;
  const timeline = timelineResponse?.data?.timeline || (timelineResponse?.data as any) || [];

  // Critical RBAC rule (PRD §8.5): Only allow note additions if reportedBy matches user._id
  const isOwner =
    incident &&
    (incident.reportedBy === user?._id ||
      (typeof incident.reportedBy === 'object' &&
        incident.reportedBy !== null &&
        incident.reportedBy._id === user?._id));

  const handleRefresh = () => {
    refetchDetail();
    refetchTimeline();
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await addNoteMutation({
        id: incidentId,
        content: newNote.trim(),
      }).unwrap();
      setNewNote('');
    } catch (err: any) {
      Alert.alert('Error', err.data?.message || 'Failed to add incident note');
    }
  };

  const handleWatchCamera = (cameraId: string, cameraName: string) => {
    if (canStream) {
      navigation.navigate('LiveView', { cameraId, cameraName });
    } else {
      setPaywallVisible(true);
    }
  };

  if (isLoadingDetail && !incident) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingSubtext}>Loading incident details...</Text>
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Incident report not found or access expired.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cameraObj =
    typeof incident.cameraId === 'object' && incident.cameraId !== null
      ? incident.cameraId
      : typeof incident.cameraId === 'string'
      ? cameras.find((c) => c._id === incident.cameraId)
      : undefined;

  const formattedDate = new Date(incident.createdAt).toLocaleString([], {
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
        {/* Incident Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <HugeIcon icon={Shield01Icon} size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.title}>{incident.title}</Text>
              <Text style={styles.reportDate}>Reported: {formattedDate}</Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            {/* Status Badge */}
            <View
              style={[
                styles.badge,
                incident.status === 'open' && styles.statusOpen,
                incident.status === 'investigating' && styles.statusInvestigating,
                incident.status === 'resolved' && styles.statusResolved,
                incident.status === 'closed' && styles.statusClosed,
              ]}
            >
              <Text style={styles.badgeText}>{incident.status.toUpperCase()}</Text>
            </View>

            {/* Severity Badge */}
            <View
              style={[
                styles.badge,
                incident.severity === 'critical' && styles.severityCritical,
                incident.severity === 'high' && styles.severityHigh,
                incident.severity === 'medium' && styles.severityMedium,
                incident.severity === 'low' && styles.severityLow,
              ]}
            >
              <Text style={styles.badgeText}>{incident.severity.toUpperCase()} SEVERITY</Text>
            </View>

            {/* Type Badge */}
            <View style={[styles.badge, styles.typeBadge]}>
              <Text style={styles.typeBadgeText}>
                {incident.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Statement & Evidence Details</Text>
          <Text style={styles.descriptionText}>{incident.description}</Text>
        </View>

        {/* Linked CCTV Camera (If associated) */}
        {cameraObj ? (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Associated CCTV Camera</Text>
            <View style={styles.cameraRow}>
              <View style={styles.cameraIconBox}>
                <HugeIcon icon={CctvCameraIcon} size={22} color={COLORS.primary} />
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
                <Text style={styles.watchLiveText}>Live Stream</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Attachments (If any) */}
        {incident.attachments && incident.attachments.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>
              Media Attachments ({incident.attachments.length})
            </Text>
            <View style={styles.attachmentsGrid}>
              {incident.attachments.map((att: any, idx: number) => (
                <View key={idx} style={styles.attachmentCard}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {(typeof att === 'string' ? att.split('/').pop() : att.fileName) ||
                      `Attachment #${idx + 1}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Notes & Follow-up Thread */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>
            Investigation Notes ({incident.notes?.length || 0})
          </Text>

          {incident.notes && incident.notes.length > 0 ? (
            incident.notes.map((note: any) => (
              <View key={note._id || Math.random().toString()} style={styles.noteItem}>
                <View style={styles.noteHeader}>
                  <HugeIcon icon={UserIcon} size={14} color={COLORS.primary} />
                  <Text style={styles.noteAuthor}>
                    {typeof note.author === 'object' && note.author !== null
                      ? note.author.name
                      : 'Authorized Responder'}
                  </Text>
                  <Text style={styles.noteTime}>
                    {new Date(note.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={styles.noteContent}>{note.content || note.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyNotesText}>
              No follow-up notes logged for this incident yet.
            </Text>
          )}

          {/* Guarded [Add Note] Composer (Owner only) */}
          {isOwner ? (
            <View style={styles.addNoteBox}>
              <TextInput
                style={styles.noteInput}
                placeholder="Add an update or additional observation..."
                placeholderTextColor={COLORS.textMuted}
                value={newNote}
                onChangeText={setNewNote}
                multiline
                editable={!isAddingNote}
              />
              <TouchableOpacity
                style={[
                  styles.sendNoteBtn,
                  (!newNote.trim() || isAddingNote) && styles.sendNoteBtnDisabled,
                ]}
                onPress={handleAddNote}
                disabled={!newNote.trim() || isAddingNote}
              >
                {isAddingNote ? (
                  <ActivityIndicator size="small" color={COLORS.textInverse} />
                ) : (
                  <HugeIcon icon={SentIcon} size={16} color={COLORS.textInverse} />
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Audit Timeline */}
        {timeline.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Incident Status Lifecycle</Text>
            {timeline.map((item: any) => (
              <View key={item._id} style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={styles.timelineAction}>{(item.action || 'UPDATE').toUpperCase()}</Text>
                  <Text style={styles.timelineTime}>
                    {new Date(item.timestamp || Date.now()).toLocaleString()} • {item.performedBy?.name || 'System'}
                  </Text>
                  {item.notes ? <Text style={styles.timelineNotes}>{item.notes}</Text> : null}
                </View>
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
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  reportDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusOpen: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
  },
  statusInvestigating: {
    backgroundColor: COLORS.infoBlueMuted,
    borderWidth: 1,
    borderColor: COLORS.infoBlue,
  },
  statusResolved: {
    backgroundColor: COLORS.successGreenMuted,
    borderWidth: 1,
    borderColor: COLORS.successGreen,
  },
  statusClosed: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  severityCritical: {
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1,
    borderColor: COLORS.sosRed,
  },
  severityHigh: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
  },
  severityMedium: {
    backgroundColor: COLORS.infoBlueMuted,
    borderWidth: 1,
    borderColor: COLORS.infoBlue,
  },
  severityLow: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBadge: {
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  typeBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  descriptionText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  cardSectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraName: {
    fontSize: 14,
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
    paddingVertical: SPACING.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchLiveText: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  attachmentCard: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  attachmentName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  noteItem: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
    flex: 1,
  },
  noteTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  noteContent: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  emptyNotesText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  addNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  noteInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    maxHeight: 80,
    paddingVertical: SPACING.xs,
  },
  sendNoteBtn: {
    backgroundColor: COLORS.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  sendNoteBtnDisabled: {
    opacity: 0.5,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  timelineAction: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '800',
  },
  timelineTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  timelineNotes: {
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
