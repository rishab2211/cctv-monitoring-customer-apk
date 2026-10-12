import React, { useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Video, { VideoRef } from 'react-native-video';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import {
  Film01Icon,
  PlayIcon,
  PauseIcon,
  Backward01Icon,
  Forward01Icon,
  Download01Icon,
  Clock01Icon,
  Calendar03Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import {
  useGetCameraPlaybackQuery,
  useGetCameraDetailQuery,
  PlaybackChunk,
} from './cameraApi';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { SubscriptionPaywallModal } from '../../components/SubscriptionPaywallModal';
import { useAppSelector } from '../../hooks/redux';
import { isCameraOwner } from '../../utils/cameraUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'RecordingPlayback'>;

export const RecordingPlaybackScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cameraId, cameraName = 'Camera Playback' } = route.params;
  const user = useAppSelector((state) => state.auth.user);

  const { data: cameraDetailResponse } = useGetCameraDetailQuery(cameraId);
  const camera = cameraDetailResponse?.data?.camera;

  const isOwner =
    route.params.isOwner !== undefined
      ? route.params.isOwner
      : camera
      ? isCameraOwner(camera, user?._id)
      : false;

  const [selectedChunk, setSelectedChunk] = useState<PlaybackChunk | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedDayOffset, setSelectedDayOffset] = useState<0 | 1>(0); // 0 = Today, 1 = Yesterday

  const videoRef = useRef<VideoRef>(null);
  const { canStream, paywallType } = useSubscriptionGuard();

  // Query window based on selected day offset
  const { startTime, endTime } = useMemo(() => {
    if (selectedDayOffset === 0) {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0); // start of today
      return {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };
    } else {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0); // start of yesterday
      const end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999); // end of yesterday
      return {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };
    }
  }, [selectedDayOffset]);

  const {
    data: playbackResponse,
    isLoading,
  } = useGetCameraPlaybackQuery(
    { cameraId, startTime, endTime },
    { skip: !canStream }
  );

  const chunks = playbackResponse?.data?.chunks || [];
  const activeVideoUrl = selectedChunk?.url || chunks[0]?.url;

  const handleDownload = async (chunk: PlaybackChunk) => {
    if (chunk.url) {
      try {
        const canOpen = await Linking.canOpenURL(chunk.url);
        if (canOpen) {
          await Linking.openURL(chunk.url);
          return;
        }
      } catch (err) {
        console.warn('[Playback] Error opening download URL:', err);
      }
    }
    Alert.alert(
      'Download Recording',
      `Accessing cloud footage: ${chunk.url || 'URL unavailable'}`,
      [{ text: 'OK' }]
    );
  };

  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      const newPos = Math.max(0, Math.min(duration, currentPosition + seconds));
      videoRef.current.seek(newPos);
    }
  };

  return (
    <View style={styles.container}>
      {/* Video Player Box */}
      <View style={styles.playerContainer}>
        {activeVideoUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: activeVideoUrl }}
            style={styles.videoPlayer}
            controls={false}
            paused={!isPlaying}
            resizeMode="contain"
            onProgress={(data) => setCurrentPosition(data.currentTime)}
            onLoad={(data) => {
              setDuration(data.duration);
              setIsPlaying(true);
            }}
            onError={(e) => console.log('[Video] Playback Error:', e)}
          />
        ) : (
          <View style={styles.emptyVideoBox}>
            {isLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <View style={styles.emptyVideoBox}>
                <HugeIcon
                  icon={Film01Icon}
                  size={48}
                  color={COLORS.textMuted}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyVideoText}>No recordings found for this period</Text>
              </View>
            )}
          </View>
        )}

        {/* Video Player Control Overlay */}
        {activeVideoUrl ? (
          <View style={styles.playerControls}>
            <TouchableOpacity onPress={() => handleSeek(-10)} style={styles.seekButton}>
              <HugeIcon icon={Backward01Icon} size={14} color="#FFFFFF" />
              <Text style={styles.seekButtonText}>10s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsPlaying(!isPlaying)}
              style={styles.playPauseButton}
            >
              <HugeIcon
                icon={isPlaying ? PauseIcon : PlayIcon}
                size={20}
                color={COLORS.textInverse}
                style={isPlaying ? undefined : styles.playIconOffset}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleSeek(10)} style={styles.seekButton}>
              <Text style={styles.seekButtonText}>10s</Text>
              <HugeIcon icon={Forward01Icon} size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Screen Content & Timeline Chunks */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerInfo}>
          <Text style={styles.cameraTitle}>{cameraName}</Text>
          <Text style={styles.timelineLabel}>Cloud Recording Footage</Text>
        </View>

        {/* Date Filter Selection Pills */}
        <View style={styles.dateFilterRow}>
          <TouchableOpacity
            style={[styles.dateFilterPill, selectedDayOffset === 0 && styles.dateFilterPillActive]}
            onPress={() => setSelectedDayOffset(0)}
          >
            <HugeIcon
              icon={Calendar03Icon}
              size={13}
              color={selectedDayOffset === 0 ? COLORS.textInverse : COLORS.textSecondary}
            />
            <Text
              style={[styles.dateFilterText, selectedDayOffset === 0 && styles.dateFilterTextActive]}
            >
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateFilterPill, selectedDayOffset === 1 && styles.dateFilterPillActive]}
            onPress={() => setSelectedDayOffset(1)}
          >
            <HugeIcon
              icon={Clock01Icon}
              size={13}
              color={selectedDayOffset === 1 ? COLORS.textInverse : COLORS.textSecondary}
            />
            <Text
              style={[styles.dateFilterText, selectedDayOffset === 1 && styles.dateFilterTextActive]}
            >
              Yesterday
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recorded Chunks List */}
        <Text style={styles.sectionHeader}>Available Video Segments ({chunks.length})</Text>

        {chunks.length > 0 ? (
          chunks.map((chunk, index) => {
            const isSelected =
              (selectedChunk && selectedChunk._id === chunk._id) ||
              (!selectedChunk && index === 0);

            const startStr = new Date(chunk.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const endStr = new Date(chunk.endTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <TouchableOpacity
                key={chunk._id}
                activeOpacity={0.85}
                style={[styles.chunkCard, isSelected && styles.chunkCardSelected]}
                onPress={() => setSelectedChunk(chunk)}
              >
                <View style={styles.chunkIconBox}>
                  <HugeIcon icon={Film01Icon} size={20} color={COLORS.primary} />
                </View>

                <View style={styles.chunkInfoCol}>
                  <Text style={[styles.chunkTime, isSelected && styles.chunkTimeSelected]}>
                    {startStr} – {endStr}
                  </Text>
                  <Text style={styles.chunkDuration}>
                    Duration: {Math.round((chunk.durationSeconds || 900) / 60)} mins • Cloud HD
                  </Text>
                </View>

                {/* Owner-Only Download Guard (PRD Decision #5) */}
                {isOwner ? (
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownload(chunk)}
                  >
                    <HugeIcon icon={Download01Icon} size={13} color={COLORS.textSecondary} />
                    <Text style={styles.downloadBtnText}>Save</Text>
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.noChunksBox}>
            <HugeIcon
              icon={Clock01Icon}
              size={36}
              color={COLORS.textMuted}
              style={styles.noChunksIconBox}
            />
            <Text style={styles.noChunksTitle}>No Recorded Footage</Text>
            <Text style={styles.noChunksDesc}>
              Continuous recording activates automatically when your CCTV camera is online.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Paywall Gate Modal */}
      <SubscriptionPaywallModal
        visible={paywallVisible}
        type={paywallType}
        onClose={() => {
          setPaywallVisible(false);
          navigation.goBack();
        }}
        onNavigateBilling={() => {
          setPaywallVisible(false);
          navigation.navigate('MainTabs', { screen: 'TabBilling' });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  playerContainer: {
    width: '100%',
    height: 230,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  emptyVideoBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyVideoIcon: {
    fontSize: 40,
    marginBottom: SPACING.xs,
  },
  emptyVideoText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
  },
  playerControls: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    marginHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  seekButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  playPauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glowTeal,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  headerInfo: {
    marginBottom: SPACING.md,
  },
  cameraTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  timelineLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dateFilterRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  dateFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    marginRight: SPACING.sm,
  },
  dateFilterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateFilterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  dateFilterTextActive: {
    color: COLORS.textInverse,
  },
  sectionHeader: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  chunkCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  chunkCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceElevated,
    ...SHADOWS.small,
  },
  chunkIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chunkTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chunkTimeSelected: {
    color: COLORS.primary,
  },
  chunkDuration: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  downloadBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  noChunksBox: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noChunksIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  noChunksTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  noChunksDesc: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  playIconOffset: {
    marginLeft: 2,
  },
  chunkInfoCol: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  emptyIcon: {
    marginBottom: SPACING.xs,
  },
  noChunksIconBox: {
    marginBottom: SPACING.sm,
  },
});

