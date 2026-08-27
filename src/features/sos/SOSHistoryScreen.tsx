import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  SirenIcon,
  Location01Icon,
  CctvCameraIcon,
  Clock01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useGetSOSHistoryQuery } from './sosApi';
import { useGetCamerasQuery } from '../cameras/cameraApi';
import { SOSAlert } from '../../types';
import { EmptyState } from '../../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'SOSHistory'>;
type FilterType = 'all' | 'active' | 'acknowledged' | 'resolved';

export const SOSHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { data: historyResponse, isLoading, isFetching, refetch } = useGetSOSHistoryQuery();
  const { data: camerasResponse } = useGetCamerasQuery();

  const alerts = historyResponse?.data?.alerts || [];
  const cameras = camerasResponse?.data?.cameras || [];

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'active') return alert.status === 'active';
      if (activeFilter === 'acknowledged') return alert.status === 'acknowledged';
      if (activeFilter === 'resolved')
        return alert.status === 'resolved' || alert.status === 'false_alarm';
      return true;
    });
  }, [alerts, activeFilter]);

  const renderStatusBadge = (status: SOSAlert['status']) => {
    switch (status) {
      case 'active':
        return (
          <View style={[styles.statusBadge, styles.statusBadgeActive]}>
            <View style={styles.pulsingDot} />
            <Text style={styles.statusTextActive}>ACTIVE</Text>
          </View>
        );
      case 'acknowledged':
        return (
          <View style={[styles.statusBadge, styles.statusBadgeAck]}>
            <Text style={styles.statusTextAck}>DISPATCHED</Text>
          </View>
        );
      case 'resolved':
        return (
          <View style={[styles.statusBadge, styles.statusBadgeResolved]}>
            <Text style={styles.statusTextResolved}>RESOLVED</Text>
          </View>
        );
      case 'false_alarm':
        return (
          <View style={[styles.statusBadge, styles.statusBadgeFalseAlarm]}>
            <Text style={styles.statusTextFalseAlarm}>FALSE ALARM</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderAlertCard = ({ item: alert }: { item: SOSAlert }) => {
    const formattedDate = new Date(alert.createdAt).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const cameraName =
      typeof alert.cameraId === 'object' && alert.cameraId !== null
        ? alert.cameraId.name
        : typeof alert.cameraId === 'string'
        ? cameras.find((c) => c._id === alert.cameraId)?.name
        : undefined;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.alertCard,
          alert.status === 'active' && styles.alertCardActive,
        ]}
        onPress={() => navigation.navigate('SOSDetail', { sosId: alert._id, alert })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconCircle}>
              <HugeIcon
                icon={SirenIcon}
                size={18}
                color={alert.status === 'active' ? COLORS.sosRed : COLORS.textMuted}
              />
            </View>
            <View style={{ marginLeft: SPACING.sm }}>
              <Text style={styles.dateText}>{formattedDate}</Text>
              <Text style={styles.idText}>ID: #{alert._id.slice(-6).toUpperCase()}</Text>
            </View>
          </View>
          {renderStatusBadge(alert.status)}
        </View>

        {/* Location Row */}
        {alert.location?.address ? (
          <View style={styles.infoRow}>
            <HugeIcon icon={Location01Icon} size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              {alert.location.address}
            </Text>
          </View>
        ) : null}

        {/* Camera Row */}
        {cameraName ? (
          <View style={styles.infoRow}>
            <HugeIcon icon={CctvCameraIcon} size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              Linked Feed: {cameraName}
            </Text>
          </View>
        ) : null}

        {/* Resolution Snippet */}
        {alert.resolutionNotes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Resolution Notes:</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {alert.resolutionNotes}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.viewTimelineText}>View Response Timeline</Text>
          <HugeIcon icon={ArrowRight01Icon} size={14} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header & Filter Pills */}
      <View style={styles.header}>
        <Text style={styles.title}>Emergency History</Text>
        <Text style={styles.subtitle}>
          Record of all triggered SOS alerts and dispatch logs
        </Text>

        <View style={styles.filtersRow}>
          {(['all', 'active', 'acknowledged', 'resolved'] as FilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                activeFilter === filter && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === filter && styles.filterPillTextActive,
                ]}
              >
                {filter.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Alert List */}
      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading emergency records...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item) => item._id}
          renderItem={renderAlertCard}
          contentContainerStyle={styles.listContent}
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
          ListEmptyComponent={
            <EmptyState
              icon={SirenIcon}
              title="No Emergency Alerts"
              description={
                activeFilter !== 'all'
                  ? 'No emergency alerts match the selected filter.'
                  : 'Your safety logs are clean. No emergency alerts have been triggered.'
              }
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  filtersRow: {
    flexDirection: 'row',
  },
  filterPill: {
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
  },
  filterPillActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 90,
  },
  alertCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  alertCardActive: {
    borderColor: COLORS.sosRed,
    backgroundColor: 'rgba(255, 59, 48, 0.06)',
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  idText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeActive: {
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1,
    borderColor: COLORS.sosRed,
  },
  statusTextActive: {
    color: COLORS.sosRed,
    fontSize: 10,
    fontWeight: '900',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.sosRed,
    marginRight: 4,
  },
  statusBadgeAck: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
  },
  statusTextAck: {
    color: COLORS.warningAmber,
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgeResolved: {
    backgroundColor: COLORS.successGreenMuted,
    borderWidth: 1,
    borderColor: COLORS.successGreen,
  },
  statusTextResolved: {
    color: COLORS.successGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgeFalseAlarm: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusTextFalseAlarm: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
  },
  infoText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs + 2,
    flex: 1,
  },
  notesBox: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  notesLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginBottom: 2,
  },
  notesText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewTimelineText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});
