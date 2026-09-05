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
import {
  CctvCameraIcon,
  PlayIcon,
  Clock01Icon,
  UserGroupIcon,
  InformationCircleIcon,
  Location01Icon,
  Search01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { StatusBadge } from '../../components/StatusBadge';
import { useGetCamerasQuery } from './cameraApi';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { SubscriptionPaywallModal } from '../../components/SubscriptionPaywallModal';
import { useAppSelector } from '../../hooks/redux';
import { Camera } from '../../types';

type FilterType = 'all' | 'online' | 'offline' | 'mine' | 'shared';

export const CameraListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CameraList'>>();
  const user = useAppSelector((state) => state.auth.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    (route.params?.filter as FilterType) || 'all'
  );
  const [paywallVisible, setPaywallVisible] = useState(false);

  const { data: camerasResponse, isLoading, isFetching, refetch } = useGetCamerasQuery();
  const rawCameras = camerasResponse?.data?.cameras;
  const cameras = useMemo(() => rawCameras || [], [rawCameras]);

  const { canStream, paywallType } = useSubscriptionGuard();

  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      const isOwner = cam.customerId === user?._id || cam.isOwner === true;

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
      if (activeFilter === 'mine') return isOwner;
      if (activeFilter === 'shared') return !isOwner;

      return true;
    });
  }, [cameras, searchQuery, activeFilter, user?._id]);

  const handleWatchLive = (camera: Camera) => {
    const isOwner = camera.customerId === user?._id || camera.isOwner === true;
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

  const handleWatchPlayback = (camera: Camera) => {
    const isOwner = camera.customerId === user?._id || camera.isOwner === true;
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

  const handleShareCamera = (camera: Camera) => {
    navigation.navigate('ShareCamera', { camera, cameraId: camera._id });
  };

  const handleCameraDetail = (camera: Camera) => {
    navigation.navigate('CameraDetail', { camera, cameraId: camera._id });
  };

  const renderCameraCard = ({ item: camera }: { item: Camera }) => {
    const isOwner = camera.isOwner !== false;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderInfo}>
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
            <View style={styles.locationRow}>
              <HugeIcon icon={Location01Icon} size={12} color={COLORS.textMuted} />
              <Text style={styles.cameraLocation} numberOfLines={1}>
                {camera.location?.address || 'Premises Camera'}
              </Text>
            </View>
          </View>
          <StatusBadge status={camera.status} />
        </View>

        {/* Video Preview Box */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.previewBox}
          onPress={() => handleWatchLive(camera)}
        >
          <HugeIcon icon={CctvCameraIcon} size={48} color={COLORS.textMuted} />
          <View style={styles.playOverlayButton}>
            <HugeIcon icon={PlayIcon} size={18} color={COLORS.textInverse} style={styles.playIconOffset} />
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
            <HugeIcon icon={PlayIcon} size={14} color={COLORS.textInverse} />
            <Text style={styles.liveBtnText}>Live Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.secondaryBtn]}
            onPress={() => handleWatchPlayback(camera)}
          >
            <HugeIcon icon={Clock01Icon} size={14} color={COLORS.textSecondary} />
            <Text style={styles.secondaryBtnText}>Recordings</Text>
          </TouchableOpacity>

          {isOwner ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.iconBtn]}
              onPress={() => handleShareCamera(camera)}
            >
              <HugeIcon icon={UserGroupIcon} size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.actionBtn, styles.iconBtn]}
            onPress={() => handleCameraDetail(camera)}
          >
            <HugeIcon icon={InformationCircleIcon} size={16} color={COLORS.textSecondary} />
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
          <HugeIcon icon={Search01Icon} size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, location, serial number..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <HugeIcon icon={Cancel01Icon} size={14} color={COLORS.textMuted} />
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
              <HugeIcon icon={CctvCameraIcon} size={48} color={COLORS.textMuted} style={{ marginBottom: SPACING.md }} />
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  cameraLocation: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginLeft: 4,
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
    flexDirection: 'row',
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
    marginLeft: 4,
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
    marginLeft: 4,
  },
  iconBtn: {
    width: 38,
    backgroundColor: COLORS.surfaceElevated,
    marginRight: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
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
  cardHeaderInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  playIconOffset: {
    marginLeft: 2,
  },
});
