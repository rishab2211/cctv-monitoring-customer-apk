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
  CustomerSupportIcon,
  PlusSignIcon,
  Comment01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useGetTicketsQuery } from './ticketsApi';
import { Ticket } from '../../types';
import { EmptyState } from '../../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'TicketList'>;
type FilterType = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

export const TicketListScreen: React.FC<Props> = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { data: ticketsResponse, isLoading, isFetching, refetch } = useGetTicketsQuery();
  const tickets = ticketsResponse?.data?.tickets || [];

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (activeFilter === 'all') return true;
      return ticket.status === activeFilter;
    });
  }, [tickets, activeFilter]);

  const renderStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return (
          <View style={[styles.badge, styles.statusOpen]}>
            <Text style={styles.statusTextOpen}>OPEN</Text>
          </View>
        );
      case 'in_progress':
        return (
          <View style={[styles.badge, styles.statusInProgress]}>
            <Text style={styles.statusTextInProgress}>IN PROGRESS</Text>
          </View>
        );
      case 'resolved':
        return (
          <View style={[styles.badge, styles.statusResolved]}>
            <Text style={styles.statusTextResolved}>RESOLVED</Text>
          </View>
        );
      case 'closed':
      default:
        return (
          <View style={[styles.badge, styles.statusClosed]}>
            <Text style={styles.statusTextClosed}>CLOSED</Text>
          </View>
        );
    }
  };

  const renderPriorityBadge = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'critical':
        return (
          <View style={[styles.badge, styles.priorityCritical]}>
            <Text style={styles.priorityTextCritical}>CRITICAL</Text>
          </View>
        );
      case 'high':
        return (
          <View style={[styles.badge, styles.priorityHigh]}>
            <Text style={styles.priorityTextHigh}>HIGH</Text>
          </View>
        );
      case 'medium':
        return (
          <View style={[styles.badge, styles.priorityMedium]}>
            <Text style={styles.priorityTextMedium}>MEDIUM</Text>
          </View>
        );
      case 'low':
      default:
        return (
          <View style={[styles.badge, styles.priorityLow]}>
            <Text style={styles.priorityTextLow}>LOW</Text>
          </View>
        );
    }
  };

  const renderTicketCard = ({ item: ticket }: { item: Ticket }) => {
    const formattedDate = new Date(ticket.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const commentsCount = ticket.comments?.length || 0;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() =>
          navigation.navigate('TicketDetail', {
            ticketId: ticket._id,
            ticket,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconCircle}>
              <HugeIcon icon={CustomerSupportIcon} size={18} color={COLORS.primary} />
            </View>
            <View style={{ marginLeft: SPACING.sm, flex: 1 }}>
              <Text style={styles.ticketTitle} numberOfLines={1}>
                {ticket.title}
              </Text>
              <Text style={styles.ticketMeta}>
                #{ticket.ticketNumber || ticket._id.slice(-6).toUpperCase()} • {formattedDate}
              </Text>
            </View>
          </View>
          {renderStatusBadge(ticket.status)}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {ticket.description}
        </Text>

        <View style={styles.badgesRow}>
          {renderPriorityBadge(ticket.priority)}
          <View style={[styles.badge, styles.categoryBadge]}>
            <Text style={styles.categoryBadgeText}>
              {ticket.category.toUpperCase()}
            </Text>
          </View>

          {commentsCount > 0 ? (
            <View style={styles.commentCountBadge}>
              <HugeIcon icon={Comment01Icon} size={12} color={COLORS.textMuted} />
              <Text style={styles.commentCountText}>{commentsCount} responses</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailText}>Open Support Thread</Text>
          <HugeIcon icon={ArrowRight01Icon} size={14} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Support Tickets</Text>
            <Text style={styles.subtitle}>Direct technical assistance from your franchise</Text>
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate('CreateTicket')}
          >
            <HugeIcon icon={PlusSignIcon} size={16} color={COLORS.textInverse} />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as FilterType[]).map((f) => (
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
                {f.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading support tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item._id}
          renderItem={renderTicketCard}
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
              icon={CustomerSupportIcon}
              title="No Support Tickets"
              description="Need help with camera feeds, billing, or installation? Open a ticket."
              actionLabel="Create Support Ticket"
              onAction={() => navigation.navigate('CreateTicket')}
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
  createBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADIUS.button,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.glowTeal,
  },
  createBtnText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  filterPill: {
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  ticketTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  ticketMeta: {
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
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusOpen: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
  },
  statusTextOpen: {
    color: COLORS.warningAmber,
    fontSize: 10,
    fontWeight: '800',
  },
  statusInProgress: {
    backgroundColor: COLORS.infoBlueMuted,
    borderWidth: 1,
    borderColor: COLORS.infoBlue,
  },
  statusTextInProgress: {
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
  priorityCritical: {
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1,
    borderColor: COLORS.sosRed,
  },
  priorityTextCritical: {
    color: COLORS.sosRed,
    fontSize: 10,
    fontWeight: '800',
  },
  priorityHigh: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
  },
  priorityTextHigh: {
    color: COLORS.warningAmber,
    fontSize: 10,
    fontWeight: '800',
  },
  priorityMedium: {
    backgroundColor: COLORS.infoBlueMuted,
    borderWidth: 1,
    borderColor: COLORS.infoBlue,
  },
  priorityTextMedium: {
    color: COLORS.infoBlue,
    fontSize: 10,
    fontWeight: '800',
  },
  priorityLow: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priorityTextLow: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  commentCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  commentCountText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
    marginLeft: 3,
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
