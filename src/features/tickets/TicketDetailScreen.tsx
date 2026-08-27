import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CustomerSupportIcon,
  SentIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useGetTicketDetailQuery, useAddTicketCommentMutation } from './ticketsApi';
import { useAppSelector } from '../../hooks/redux';

type Props = NativeStackScreenProps<RootStackParamList, 'TicketDetail'>;

export const TicketDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { ticketId, ticket: initialTicket } = route.params;
  const user = useAppSelector((state) => state.auth.user);
  const [commentText, setCommentText] = useState('');

  const {
    data: detailResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetTicketDetailQuery(ticketId);

  const [addCommentMutation, { isLoading: isSending }] = useAddTicketCommentMutation();

  const ticket = (detailResponse?.data as any)?.ticket || detailResponse?.data || initialTicket;
  const comments = ticket?.comments || [];

  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    try {
      await addCommentMutation({
        ticketId,
        text: commentText.trim(),
      }).unwrap();
      setCommentText('');
    } catch (err: any) {
      Alert.alert('Error', err.data?.message || 'Failed to send comment.');
    }
  };

  if (isLoading && !ticket) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingSubtext}>Loading ticket conversation...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Support ticket not found or access expired.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDate = new Date(ticket.createdAt).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
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
        {/* Ticket Header Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <HugeIcon icon={CustomerSupportIcon} size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.ticketNumber}>
                #{ticket.ticketNumber || ticket._id.slice(-6).toUpperCase()}
              </Text>
              <Text style={styles.ticketTitle}>{ticket.title}</Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            {/* Status */}
            <View
              style={[
                styles.badge,
                ticket.status === 'open' && styles.statusOpen,
                ticket.status === 'in_progress' && styles.statusInProgress,
                ticket.status === 'resolved' && styles.statusResolved,
                ticket.status === 'closed' && styles.statusClosed,
              ]}
            >
              <Text style={styles.badgeText}>{ticket.status.replace('_', ' ').toUpperCase()}</Text>
            </View>

            {/* Priority */}
            <View
              style={[
                styles.badge,
                ticket.priority === 'critical' && styles.priorityCritical,
                ticket.priority === 'high' && styles.priorityHigh,
                ticket.priority === 'medium' && styles.priorityMedium,
                ticket.priority === 'low' && styles.priorityLow,
              ]}
            >
              <Text style={styles.badgeText}>{ticket.priority.toUpperCase()}</Text>
            </View>

            {/* Category */}
            <View style={[styles.badge, styles.categoryBadge]}>
              <Text style={styles.categoryBadgeText}>{ticket.category.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Initial Problem Description</Text>
          <Text style={styles.descriptionText}>{ticket.description}</Text>
          <Text style={styles.ticketDate}>Opened on {formattedDate}</Text>
        </View>

        {/* Closed Ticket Notice */}
        {ticket.status === 'closed' || ticket.status === 'resolved' ? (
          <View style={styles.closedNotice}>
            <HugeIcon icon={AlertCircleIcon} size={16} color={COLORS.warningAmber} />
            <Text style={styles.closedNoticeText}>
              This ticket is marked as {ticket.status}. Sending a reply will automatically reopen the thread for support.
            </Text>
          </View>
        ) : null}

        {/* Conversation Thread */}
        <View style={styles.threadContainer}>
          <Text style={styles.threadSectionTitle}>Discussion & Updates</Text>

          {comments.length > 0 ? (
            comments.map((comment: any) => {
              const isMine =
                typeof comment.sender === 'object' && comment.sender !== null
                  ? comment.sender._id === user?._id
                  : comment.sender === user?._id;

              const senderName =
                typeof comment.sender === 'object' && comment.sender !== null
                  ? comment.sender.name
                  : isMine
                  ? 'You'
                  : 'Support Engineer';

              const commentTime = new Date(comment.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View
                  key={comment._id}
                  style={[styles.messageRow, isMine ? styles.myMessageRow : styles.otherMessageRow]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isMine ? styles.myBubble : styles.otherBubble,
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <Text
                        style={[
                          styles.messageSender,
                          isMine ? styles.mySenderText : styles.otherSenderText,
                        ]}
                      >
                        {senderName}
                      </Text>
                      <Text style={styles.messageTime}>{commentTime}</Text>
                    </View>
                    <Text
                      style={[
                        styles.messageText,
                        isMine ? styles.myMessageText : styles.otherMessageText,
                      ]}
                    >
                      {comment.text}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyThreadBox}>
              <Text style={styles.emptyThreadText}>
                No messages yet. Our support engineers will respond shortly.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Message Composer */}
      <View style={styles.composerContainer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Type your response or update..."
          placeholderTextColor={COLORS.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          editable={!isSending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!commentText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={COLORS.textInverse} />
          ) : (
            <HugeIcon icon={SentIcon} size={16} color={COLORS.textInverse} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 20,
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
  ticketNumber: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
  statusInProgress: {
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
  priorityCritical: {
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 1,
    borderColor: COLORS.sosRed,
  },
  priorityHigh: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
  },
  priorityMedium: {
    backgroundColor: COLORS.infoBlueMuted,
    borderWidth: 1,
    borderColor: COLORS.infoBlue,
  },
  priorityLow: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  descriptionText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  ticketDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  closedNotice: {
    backgroundColor: 'rgba(255, 159, 10, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  closedNoticeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warningAmber,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 16,
  },
  threadContainer: {
    marginBottom: SPACING.md,
  },
  threadSectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    padding: SPACING.md,
    borderRadius: RADIUS.card,
  },
  myBubble: {
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '700',
  },
  mySenderText: {
    color: COLORS.primary,
  },
  otherSenderText: {
    color: COLORS.infoBlue,
  },
  messageTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginLeft: SPACING.md,
  },
  messageText: {
    ...TYPOGRAPHY.bodySmall,
    lineHeight: 18,
  },
  myMessageText: {
    color: COLORS.textPrimary,
  },
  otherMessageText: {
    color: COLORS.textPrimary,
  },
  emptyThreadBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyThreadText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  composerInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    ...SHADOWS.glowTeal,
  },
  sendButtonDisabled: {
    opacity: 0.5,
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
