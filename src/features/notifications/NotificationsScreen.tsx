import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Notification01Icon,
  AlertCircleIcon,
  Settings01Icon,
  BubbleChatIcon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  CheckmarkSquare01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} from './notificationsApi';
import { AppNotification } from '../../types';
import { EmptyState } from '../../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const {
    data: notifsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetNotificationsQuery({ page, limit: 20 });

  const [markReadMutation] = useMarkNotificationAsReadMutation();
  const [markAllReadMutation, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();
  const [deleteMutation] = useDeleteNotificationMutation();

  const rawNotifs = notifsResponse?.data as any;
  const notifications: AppNotification[] = Array.isArray(rawNotifs)
    ? rawNotifs
    : rawNotifs?.notifications || [];
  const unreadCount =
    rawNotifs?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation().unwrap();
    } catch (err: any) {
      Alert.alert('Error', err.data?.message || 'Failed to mark all as read');
    }
  };

  const handleNotificationPress = async (notif: AppNotification) => {
    // 1. Optimistically mark as read if not already
    if (!notif.isRead) {
      try {
        await markReadMutation(notif._id).unwrap();
      } catch (e) {
        // silent fail on mark read
      }
    }

    // 2. Resolve target screen from payload
    const entityType = notif.data?.entityType?.toLowerCase() || '';
    const entityId = notif.data?.entityId || '';

    if (entityType === 'sos' && entityId) {
      navigation.navigate('SOSDetail', { sosId: entityId });
    } else if (entityType === 'incident' && entityId) {
      navigation.navigate('IncidentDetail', { incidentId: entityId });
    } else if (entityType === 'ticket' && entityId) {
      navigation.navigate('TicketDetail', { ticketId: entityId });
    } else if (entityType === 'camera' && entityId) {
      navigation.navigate('LiveView', { cameraId: entityId });
    } else if (entityType === 'subscription' || entityType === 'invoice') {
      navigation.navigate('InvoiceList');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to remove this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation(id).unwrap();
            } catch (err: any) {
              Alert.alert('Error', err.data?.message || 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'alert':
        return AlertCircleIcon;
      case 'system':
        return Settings01Icon;
      case 'message':
        return BubbleChatIcon;
      default:
        return Notification01Icon;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'alert':
        return COLORS.error;
      case 'system':
        return COLORS.secondary;
      case 'message':
        return COLORS.primary;
      default:
        return COLORS.primary;
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const icon = getIconForType(item.type);
    const iconColor = getColorForType(item.type);
    const dateFormatted = new Date(item.createdAt).toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
          <HugeIcon icon={icon} size={20} color={iconColor} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead ? <View style={styles.unreadDot} /> : null}
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>

          <View style={styles.footerRow}>
            <Text style={styles.timestamp}>{dateFormatted}</Text>

            <View style={styles.actionButtons}>
              {!item.isRead ? (
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={() => markReadMutation(item._id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <HugeIcon icon={CheckmarkCircle01Icon} size={16} color={COLORS.primary} />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => handleDelete(item._id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <HugeIcon icon={Delete02Icon} size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Banner / Actions */}
      <View style={styles.topBar}>
        <Text style={styles.topBarSubtext}>
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
            : 'All caught up!'}
        </Text>

        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllRead}
            disabled={isMarkingAll}
          >
            {isMarkingAll ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <HugeIcon icon={CheckmarkSquare01Icon} size={14} color={COLORS.primary} />
                <Text style={styles.markAllText}>Mark all read</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
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
              icon={Notification01Icon}
              title="No Notifications Yet"
              description="Security events, maintenance updates, and billing receipts will appear here."
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBarSubtext: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: `${COLORS.primary}12`,
    gap: 4,
  },
  markAllText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  unreadCard: {
    borderColor: `${COLORS.primary}40`,
    backgroundColor: `${COLORS.primary}05`,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.textPrimary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  message: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionIconBtn: {
    padding: 4,
  },
});
