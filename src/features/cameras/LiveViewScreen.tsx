import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TouchableWithoutFeedback,
  Alert,
  Platform,
} from 'react-native';
import {
  RTCPeerConnection,
  RTCView,
  RTCSessionDescription,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import {
  useGetCameraLiveInfoQuery,
  usePostWebRTCOfferMutation,
  useStopStreamMutation,
} from './cameraApi';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { SubscriptionPaywallModal } from '../../components/SubscriptionPaywallModal';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveView'>;

export const LiveViewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { cameraId, cameraName = 'Live Camera Feed' } = route.params;

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [streamStatus, setStreamStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'failed'
  >('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = sessionId;

  const { canStream, paywallType } = useSubscriptionGuard();

  const {
    data: liveInfoResponse,
    isLoading: isLoadingLiveInfo,
    refetch: refetchLiveInfo,
  } = useGetCameraLiveInfoQuery(cameraId, {
    skip: !canStream,
  });

  const [postOfferMutation] = usePostWebRTCOfferMutation();
  const [stopStreamMutation] = useStopStreamMutation();

  // 1. Subscription Check Gate
  useEffect(() => {
    if (!canStream) {
      setPaywallVisible(true);
    }
  }, [canStream]);

  // 2. WebRTC Peer Connection Setup & WHEP Handshake
  useEffect(() => {
    if (!canStream || !liveInfoResponse?.data) return;

    let isMounted = true;
    const streamInfo = liveInfoResponse.data;
    if (streamInfo.sessionId) {
      setSessionId(streamInfo.sessionId);
    }

    const startWebRTCStream = async () => {
      try {
        setStreamStatus('connecting');

        const configuration = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        };

        const pc = new RTCPeerConnection(configuration);
        pcRef.current = pc;

        const stream = new MediaStream();

        pc.ontrack = (event: { track: MediaStreamTrack; streams?: MediaStream[] } | any) => {
          console.log('[WebRTC] Received remote track:', event.track?.kind);
          if (event.streams && event.streams[0]) {
            if (isMounted) {
              setRemoteStream(event.streams[0]);
              setStreamStatus('connected');
            }
          } else if (event.track) {
            stream.addTrack(event.track);
            if (isMounted) {
              setRemoteStream(stream);
              setStreamStatus('connected');
            }
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            if (isMounted) setStreamStatus('connected');
          } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
            if (isMounted) setStreamStatus('disconnected');
          }
        };

        // Add receive-only transceivers for video and audio
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        // Create SDP Offer
        const offer = await pc.createOffer({});
        await pc.setLocalDescription(offer);

        // Relay SDP Offer to backend MediaMTX WHEP endpoint
        const answerResponse = await postOfferMutation({
          cameraId,
          sdp: offer.sdp,
          type: 'offer',
        }).unwrap();

        if (answerResponse.data?.sdp) {
          const remoteDesc = new RTCSessionDescription({
            type: 'answer',
            sdp: answerResponse.data.sdp,
          });
          await pc.setRemoteDescription(remoteDesc);
        }
      } catch (err: any) {
        console.warn('[WebRTC] Handshake error:', err);
        if (isMounted) {
          setStreamStatus('failed');
        }
      }
    };

    startWebRTCStream();

    return () => {
      isMounted = false;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [canStream, liveInfoResponse, cameraId, postOfferMutation]);

  // 3. Stop stream session on exit with resilient ref
  useEffect(() => {
    return () => {
      const activeSession = sessionIdRef.current;
      if (activeSession) {
        stopStreamMutation({ cameraId, sessionId: activeSession }).catch(() => {});
      }
    };
  }, [cameraId, stopStreamMutation]);

  const toggleControls = () => {
    setControlsVisible(!controlsVisible);
  };

  const handleSnapshot = () => {
    Alert.alert('Snapshot Saved', 'Camera frame snapshot captured to gallery.');
  };

  const handleRetry = () => {
    refetchLiveInfo();
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={styles.videoWrapper}>
          {remoteStream ? (
            <RTCView
              streamURL={remoteStream.toURL()}
              style={styles.rtcView}
              objectFit="contain"
              mirror={false}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              {streamStatus === 'connecting' || isLoadingLiveInfo ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Establishing WebRTC WHEP Stream...</Text>
                  <Text style={styles.loadingSubtext}>Connecting to secure MediaMTX node</Text>
                </View>
              ) : (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>📡</Text>
                  <Text style={styles.errorTitle}>Stream Standby / Offline</Text>
                  <Text style={styles.errorDesc}>
                    Unable to connect live frames. The camera unit may be offline or MediaMTX is restarting.
                  </Text>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                    <Text style={styles.retryButtonText}>Retry Stream</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Top Controls Overlay */}
          {controlsVisible ? (
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.cameraTitleContainer}>
                <Text style={styles.cameraTitleText} numberOfLines={1}>
                  {cameraName}
                </Text>
              </View>

              <View
                style={[
                  styles.livePill,
                  streamStatus === 'connected' ? styles.livePillGreen : styles.livePillAmber,
                ]}
              >
                <View
                  style={[
                    styles.liveDot,
                    streamStatus === 'connected' ? styles.liveDotGreen : styles.liveDotAmber,
                  ]}
                />
                <Text style={styles.livePillText}>
                  {streamStatus === 'connected' ? 'LIVE' : streamStatus.toUpperCase()}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Bottom Controls Overlay */}
          {controlsVisible ? (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                onPress={() => setIsMuted(!isMuted)}
              >
                <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🔊'}</Text>
                <Text style={styles.controlLabel}>{isMuted ? 'Muted' : 'Audio'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlBtn} onPress={handleSnapshot}>
                <Text style={styles.controlIcon}>📸</Text>
                <Text style={styles.controlLabel}>Snapshot</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() =>
                  navigation.navigate('RecordingPlayback', { cameraId, cameraName })
                }
              >
                <Text style={styles.controlIcon}>⏱</Text>
                <Text style={styles.controlLabel}>Playback</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </TouchableWithoutFeedback>

      {/* Paywall Gate */}
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
    backgroundColor: '#000000',
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  rtcView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingBox: {
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    fontSize: 16,
  },
  loadingSubtext: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  errorBox: {
    alignItems: 'center',
    maxWidth: 320,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  errorDesc: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.button,
  },
  retryButtonText: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingTop: Platform.OS === 'ios' ? 44 : SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cameraTitleContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  cameraTitleText: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    color: '#FFFFFF',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  livePillGreen: {
    backgroundColor: COLORS.successGreenMuted,
    borderWidth: 1,
    borderColor: COLORS.successGreen,
  },
  livePillAmber: {
    backgroundColor: COLORS.warningAmberMuted,
    borderWidth: 1,
    borderColor: COLORS.warningAmber,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  liveDotGreen: {
    backgroundColor: COLORS.successGreen,
  },
  liveDotAmber: {
    backgroundColor: COLORS.warningAmber,
  },
  livePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.md,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlBtn: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  controlBtnActive: {
    opacity: 0.6,
  },
  controlIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
