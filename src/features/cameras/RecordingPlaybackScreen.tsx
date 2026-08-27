import React, { useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { useGetCameraPlaybackQuery } from './cameraApi';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { SubscriptionPaywallModal } from '../../components/SubscriptionPaywallModal';
import { PlaybackChunk } from './cameraApi';

type Props = NativeStackScreenProps<RootStackParamList, 'RecordingPlayback'>;

export const RecordingPlaybackScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cameraId, cameraName = 'Camera Playback', isOwner = true } = route.params;

  const [selectedChunk, setSelectedChunk] = useState<PlaybackChunk | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<VideoRef>(null);
  const { canStream, paywallType } = useSubscriptionGuard();

  // Query 24h window by default (today's start to now)
  const { startTime, endTime } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0); // start of today
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
  }, []);

  const {
    data: playbackResponse,
    isLoading,
  } = useGetCameraPlaybackQuery(
    { cameraId, startTime, endTime },
    { skip: !canStream }
  );

  const chunks = playbackResponse?.data?.chunks || [];
  const activeVideoUrl = selectedChunk?.url || chunks[0]?.url;

  const handleDownload = (chunk: PlaybackChunk) => {
    Alert.alert(
      'Download Recording',
      `Downloading recording segment (${new Date(chunk.startTime).toLocaleTimeString()} - ${new Date(chunk.endTime).toLocaleTimeString()})...`,
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
              <>
                <HugeIcon icon={Film01Icon} size={48} color={COLORS.textMuted} style={{ marginBottom: SPACING.xs }} />
                <Text style={styles.emptyVideoText}>No recordings found for this period</Text>
              </>
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
                style={{ marginLeft: isPlaying ? 0 : 2 }}
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
          <Text style={styles.timelineLabel}>24h Cloud Recording Timeline</Text>
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

                <View style={{ flex: 1, marginLeft: SPACING.md }}>
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
            <HugeIcon icon={Clock01Icon} size={36} color={COLORS.textMuted} style={{ marginBottom: SPACING.sm }} />
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
    marginBottom: SPACING.lg,
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
});
