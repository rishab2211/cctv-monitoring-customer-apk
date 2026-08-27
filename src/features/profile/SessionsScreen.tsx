import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  SmartPhone01Icon,
  ComputerIcon,
  Shield01Icon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import {
  useGetActiveSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllOtherSessionsMutation,
} from './profileApi';
import { Session } from '../../types';
import { EmptyState } from '../../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'Sessions'>;

export const SessionsScreen: React.FC<Props> = () => {
  const {
    data: sessionsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetActiveSessionsQuery();

  const [revokeMutation, { isLoading: isRevoking }] = useRevokeSessionMutation();
  const [revokeAllMutation, { isLoading: isRevokingAll }] = useRevokeAllOtherSessionsMutation();

  const rawData = sessionsResponse?.data as any;
  const currentSessionId = rawData?.currentSessionId;
  const sessions: Session[] = Array.isArray(rawData) ? rawData : rawData?.sessions || [];
  const otherSessionsCount = sessions.filter((s) => s.sessionId !== currentSessionId).length;

  const handleRevokeSingle = (session: Session) => {
    const isCurrent = session.sessionId === currentSessionId;

    if (isCurrent) {
      Alert.alert(
        'Revoke Current Session?',
        'Revoking this active session will immediately log you out on this device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out & Revoke',
            style: 'destructive',
            onPress: async () => {
              try {
                await revokeMutation(session.sessionId || session._id).unwrap();
              } catch (err: any) {
                Alert.alert('Error', err.data?.message || 'Failed to revoke session');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Revoke Device Session',
        `Do you want to log out session on ${session.deviceName || session.os || 'this device'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Revoke',
            style: 'destructive',
            onPress: async () => {
              try {
                await revokeMutation(session.sessionId || session._id).unwrap();
              } catch (err: any) {
                Alert.alert('Error', err.data?.message || 'Failed to revoke session');
              }
            },
          },
        ]
      );
    }
  };

  const handleRevokeAllOther = () => {
    Alert.alert(
      'Sign Out Other Devices',
      `This will revoke access for all ${otherSessionsCount} other logged-in device(s). You will stay logged in here.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out Others',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await revokeAllMutation().unwrap();
              Alert.alert(
                'Sessions Revoked',
                `${res.data?.revokedCount || otherSessionsCount} other device(s) have been signed out.`
              );
            } catch (err: any) {
              Alert.alert('Error', err.data?.message || 'Failed to revoke other sessions');
            }
          },
        },
      ]
    );
  };

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === 'desktop') return ComputerIcon;
    return SmartPhone01Icon;
  };

  const renderItem = ({ item }: { item: Session }) => {
    const isCurrent = item.sessionId === currentSessionId;
    const icon = getDeviceIcon(item.deviceType);
    const lastActiveFormatted = new Date(item.lastActiveAt || item.createdAt).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return (
      <View style={[styles.sessionCard, isCurrent && styles.currentCard]}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: isCurrent ? `${COLORS.primary}15` : `${COLORS.textSecondary}15` },
          ]}
        >
          <HugeIcon icon={icon} size={22} color={isCurrent ? COLORS.primary : COLORS.textSecondary} />
        </View>

        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.deviceName} numberOfLines={1}>
              {item.deviceName || `${item.os || 'Unknown Device'} (${item.browser || 'App'})`}
            </Text>
            {isCurrent ? (
              <View style={styles.currentBadge}>
                <HugeIcon icon={CheckmarkCircle01Icon} size={12} color={COLORS.primary} />
                <Text style={styles.currentBadgeText}>THIS DEVICE</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.ipText}>IP: {item.ipAddress || '127.0.0.1'}</Text>
          <Text style={styles.lastActiveText}>Last active: {lastActiveFormatted}</Text>
        </View>

        <TouchableOpacity
          style={[styles.revokeBtn, isCurrent && styles.revokeBtnCurrent]}
          onPress={() => handleRevokeSingle(item)}
          disabled={isRevoking}
        >
          <HugeIcon
            icon={Delete02Icon}
            size={16}
            color={isCurrent ? COLORS.error : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerBox}>
        <View style={styles.headerIconCircle}>
          <HugeIcon icon={Shield01Icon} size={24} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <Text style={styles.headerTitle}>Active Device Sessions</Text>
          <Text style={styles.headerSubtext}>
            Manage and revoke access from phones, tablets, and computers logged into your account.
          </Text>
        </View>
      </View>

      {/* Mass Revoke CTA */}
      {otherSessionsCount > 0 ? (
        <View style={styles.massRevokeContainer}>
          <TouchableOpacity
            style={styles.massRevokeBtn}
            onPress={handleRevokeAllOther}
            disabled={isRevokingAll}
          >
            {isRevokingAll ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <>
                <HugeIcon icon={AlertCircleIcon} size={16} color={COLORS.error} />
                <Text style={styles.massRevokeText}>
                  Sign Out All Other Devices ({otherSessionsCount})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {isLoading && sessions.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading active sessions...</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.sessionId || item._id}
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
              icon={Shield01Icon}
              title="No Active Sessions"
              description="No active login sessions found."
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
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  headerSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  massRevokeContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  massRevokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.error}12`,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: `${COLORS.error}30`,
    gap: SPACING.xs,
  },
  massRevokeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
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
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  currentCard: {
    borderColor: `${COLORS.primary}50`,
    backgroundColor: `${COLORS.primary}05`,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  deviceName: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.textPrimary,
    flex: 1,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}18`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    gap: 3,
  },
  currentBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  ipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  lastActiveText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  revokeBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  revokeBtnCurrent: {
    backgroundColor: `${COLORS.error}15`,
  },
});
