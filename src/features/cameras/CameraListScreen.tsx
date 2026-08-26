import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { StatusBadge } from '../../components/StatusBadge';
import { useGetCamerasQuery } from './cameraApi';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { SubscriptionPaywallModal } from '../../components/SubscriptionPaywallModal';
import { Camera } from '../../types';

type FilterType = 'all' | 'online' | 'offline' | 'mine' | 'shared';

export const CameraListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CameraList'>>();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    (route.params?.filter as FilterType) || 'all'
  );
  const [paywallVisible, setPaywallVisible] = useState(false);

  const { data: camerasResponse, isLoading, isFetching, refetch } = useGetCamerasQuery();
  const cameras = camerasResponse?.data?.cameras || [];

  const { canStream, paywallType } = useSubscriptionGuard();

  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      // 1. Search Query Match
      const matchesSearch =
        searchQuery.trim() === '' ||
        cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.location?.address?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Filter Tab Match
      if (activeFilter === 'online') return cam.status === 'online';
      if (activeFilter === 'offline') return cam.status === 'offline';
      if (activeFilter === 'mine') return cam.isOwner !== false;
      if (activeFilter === 'shared') return cam.isOwner === false;

      return true;
    });
  }, [cameras, searchQuery, activeFilter]);

  const handleWatchLive = (camera: Camera) => {
    if (canStream) {
      navigation.navigate('LiveView', {
        cameraId: camera._id,
        cameraName: camera.name,
        isOwner: camera.isOwner !== false,
      });
    } else {
      setPaywallVisible(true);
    }
  };

  const handleWatchPlayback = (camera: Camera) => {
    if (canStream) {
      navigation.navigate('RecordingPlayback', {
        cameraId: camera._id,
        cameraName: camera.name,
        isOwner: camera.isOwner !== false,
      });
    } else {
      setPaywallVisible(true);
    }
  };

  const renderCameraCard = ({ item: camera }: { item: Camera }) => {
    const isOwner = camera.isOwner !== false;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <View style={styles.titleRow}>
              <Text style={styles.cameraName} numberOfLines={1}>
                {camera.name}
              </Text>
              {!isOwner ? (
                <View style={styles.sharedBadge}>
                  <Text style={styles.sharedBadgeText}>SHARED</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cameraLocation} numberOfLines={1}>
              📍 {camera.location?.address || 'Premises Camera'}
            </Text>
          </View>
          <StatusBadge status={camera.status} />
        </View>

        {/* Video Preview Box */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.previewBox}
          onPress={() => handleWatchLive(camera)}
        >
          <Text style={styles.previewIcon}>📹</Text>
          <View style={styles.playOverlayButton}>
            <Text style={styles.playIconText}>▶</Text>
          </View>
          <View style={styles.serialBox}>
            <Text style={styles.serialText}>SN: {camera.serialNumber || camera._id.slice(-6)}</Text>
          </View>
        </TouchableOpacity>

        {/* Action Controls */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.liveBtn]}
            onPress={() => handleWatchLive(camera)}
          >
            <Text style={styles.liveBtnText}>▶ Live Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.secondaryBtn]}
            onPress={() => handleWatchPlayback(camera)}
          >
            <Text style={styles.secondaryBtnText}>⏱ Recordings</Text>
          </TouchableOpacity>

          {isOwner ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.iconBtn]}
              onPress={() => navigation.navigate('ShareCamera', { camera, cameraId: camera._id })}
            >
              <Text style={styles.iconBtnText}>👥</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.actionBtn, styles.iconBtn]}
            onPress={() => navigation.navigate('CameraDetail', { camera, cameraId: camera._id })}
          >
            <Text style={styles.iconBtnText}>ℹ️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Camera Feeds</Text>
        <Text style={styles.subtitle}>
          {cameras.length} active surveillance units connected
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, location, serial number..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          {(['all', 'online', 'offline', 'mine', 'shared'] as FilterType[]).map((f) => (
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
          ))}
        </View>
      </View>

      {/* Cameras List */}
      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCameras}
          keyExtractor={(item) => item._id}
          renderItem={renderCameraCard}
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
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📹</Text>
              <Text style={styles.emptyStateTitle}>No Cameras Found</Text>
              <Text style={styles.emptyStateDesc}>
                {searchQuery || activeFilter !== 'all'
                  ? 'No camera matches the active filter or search query.'
                  : 'No CCTV units linked to your account yet.'}
              </Text>
            </View>
          }
        />
      )}

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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  clearIcon: {
    color: COLORS.textMuted,
    fontSize: 14,
    padding: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: SPACING.xs,
  },
  filterPill: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
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
    marginBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraName: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginRight: SPACING.xs,
  },
  sharedBadge: {
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
  cameraLocation: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  previewBox: {
    height: 150,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  previewIcon: {
    fontSize: 40,
    opacity: 0.4,
  },
  playOverlayButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glowTeal,
  },
  playIconText: {
    color: COLORS.textInverse,
    fontSize: 16,
    marginLeft: 3,
  },
  serialBox: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serialText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBtn: {
    flex: 1.2,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.xs,
  },
  liveBtnText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1.1,
    backgroundColor: COLORS.surfaceElevated,
    marginRight: SPACING.xs,
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  iconBtn: {
    width: 38,
    backgroundColor: COLORS.surfaceElevated,
    marginRight: SPACING.xs,
  },
  iconBtnText: {
    fontSize: 15,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptyStateDesc: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
});
