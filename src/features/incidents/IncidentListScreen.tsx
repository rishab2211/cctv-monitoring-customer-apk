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
  AlertCircleIcon,
  CctvCameraIcon,
  Clock01Icon,
  ArrowRight01Icon,
  Shield01Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useGetIncidentsQuery } from './incidentsApi';
import { Incident } from '../../types';
import { EmptyState } from '../../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'IncidentList'>;
type FilterType = 'all' | 'open' | 'investigating' | 'resolved' | 'closed';

export const IncidentListScreen: React.FC<Props> = ({ navigation, route }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    (route.params?.filter as FilterType) || 'all'
  );

  const { data: incidentsResponse, isLoading, isFetching, refetch } = useGetIncidentsQuery();
  const incidents = incidentsResponse?.data?.incidents || [];

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (activeFilter === 'all') return true;
      return incident.status === activeFilter;
    });
  }, [incidents, activeFilter]);

  const renderSeverityBadge = (severity: Incident['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <View style={[styles.badge, styles.severityCritical]}>
            <Text style={styles.badgeTextCritical}>CRITICAL</Text>
          </View>
        );
      case 'high':
        return (
          <View style={[styles.badge, styles.severityHigh]}>
            <Text style={styles.badgeTextHigh}>HIGH</Text>
          </View>
        );
      case 'medium':
        return (
          <View style={[styles.badge, styles.severityMedium]}>
            <Text style={styles.badgeTextMedium}>MEDIUM</Text>
          </View>
        );
      case 'low':
      default:
        return (
          <View style={[styles.badge, styles.severityLow]}>
            <Text style={styles.badgeTextLow}>LOW</Text>
          </View>
        );
    }
  };

  const renderStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'open':
        return (
          <View style={[styles.badge, styles.statusOpen]}>
            <View style={styles.dotOpen} />
            <Text style={styles.statusTextOpen}>OPEN</Text>
          </View>
        );
      case 'investigating':
        return (
          <View style={[styles.badge, styles.statusInvestigating]}>
            <Text style={styles.statusTextInvestigating}>INVESTIGATING</Text>
          </View>
        );
      case 'resolved':
        return (
          <View style={[styles.badge, styles.statusResolved]}>
            <Text style={styles.statusTextResolved}>RESOLVED</Text>
          </View>
        );
      case 'closed':
        return (
          <View style={[styles.badge, styles.statusClosed]}>
            <Text style={styles.statusTextClosed}>CLOSED</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderIncidentCard = ({ item: incident }: { item: Incident }) => {
    const formattedDate = new Date(incident.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const cameraName =
      typeof incident.cameraId === 'object' && incident.cameraId !== null
        ? incident.cameraId.name
        : undefined;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() =>
          navigation.navigate('IncidentDetail', {
            incidentId: incident._id,
            incident,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconCircle}>
              <HugeIcon icon={Shield01Icon} size={18} color={COLORS.primary} />
            </View>
            <View style={{ marginLeft: SPACING.sm, flex: 1 }}>
              <Text style={styles.incidentTitle} numberOfLines={1}>
                {incident.title}
              </Text>
              <Text style={styles.incidentDate}>
                {formattedDate} • Type: {incident.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {incident.description}
        </Text>

        <View style={styles.badgesRow}>
          {renderStatusBadge(incident.status)}
          <View style={{ width: SPACING.xs }} />
          {renderSeverityBadge(incident.severity)}
          {cameraName ? (
            <View style={styles.cameraTag}>
              <HugeIcon icon={CctvCameraIcon} size={12} color={COLORS.textMuted} />
              <Text style={styles.cameraTagText} numberOfLines={1}>
                {cameraName}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailText}>View Full Report & Notes</Text>
          <HugeIcon icon={ArrowRight01Icon} size={14} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Title & Action */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Incident Reports</Text>
            <Text style={styles.subtitle}>
              Track security events, breaches & filed reports
            </Text>
          </View>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => navigation.navigate('ReportIncident')}
          >
            <HugeIcon icon={PlusSignIcon} size={16} color={COLORS.textInverse} />
            <Text style={styles.reportBtnText}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          {(['all', 'open', 'investigating', 'resolved', 'closed'] as FilterType[]).map(
            (f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeFilter === f && styles.filterPillTextActive,
                  ]}
                >
                  {f.toUpperCase()}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* Incidents List */}
      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading incident records...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredIncidents}
          keyExtractor={(item) => item._id}
          renderItem={renderIncidentCard}
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
              icon={Shield01Icon}
              title="No Incidents Reported"
              description={
                activeFilter !== 'all'
                  ? `No incident reports match the '${activeFilter}' filter.`
                  : 'Your security premises have zero reported incident breaches.'
              }
              actionLabel="Report New Incident"
              onAction={() => navigation.navigate('ReportIncident')}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  reportBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADIUS.button,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.glowTeal,
  },
  reportBtnText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  incidentDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityCritical: {
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1,
    borderColor: COLORS.sosRed,
  },
  badgeTextCritical: {
    color: COLORS.sosRed,
    fontSize: 10,
    fontWeight: '800',
  },
  severityHigh: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
  },
  badgeTextHigh: {
    color: COLORS.warningAmber,
    fontSize: 10,
    fontWeight: '800',
  },
  severityMedium: {
    backgroundColor: COLORS.infoBlueMuted,
    borderWidth: 1,
    borderColor: COLORS.infoBlue,
  },
  badgeTextMedium: {
    color: COLORS.infoBlue,
    fontSize: 10,
    fontWeight: '800',
  },
  severityLow: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeTextLow: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  statusOpen: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
  },
  dotOpen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.warningAmber,
    marginRight: 4,
  },
  statusTextOpen: {
    color: COLORS.warningAmber,
    fontSize: 10,
    fontWeight: '800',
  },
  statusInvestigating: {
    backgroundColor: COLORS.infoBlueMuted,
    borderWidth: 1,
    borderColor: COLORS.infoBlue,
  },
  statusTextInvestigating: {
    color: COLORS.infoBlue,
    fontSize: 10,
    fontWeight: '800',
  },
  statusResolved: {
    backgroundColor: COLORS.successGreenMuted,
    borderWidth: 1,
    borderColor: COLORS.successGreen,
  },
  statusTextResolved: {
    color: COLORS.successGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  statusClosed: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusTextClosed: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  cameraTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginLeft: SPACING.xs,
  },
  cameraTagText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
    marginLeft: 3,
    maxWidth: 120,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewDetailText: {
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
