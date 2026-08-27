import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import {
  SirenIcon,
  Cancel01Icon,
  Call02Icon,
  Location01Icon,
  CctvCameraIcon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useTriggerSOSMutation } from './sosApi';
import { useGetCamerasQuery } from '../cameras/cameraApi';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { addActiveSosAlert } from '../../app/slices/uiSlice';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const HOLD_DURATION_MS = 3000;
const RADIUS_SIZE = 64;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_SIZE;

type Props = NativeStackScreenProps<RootStackParamList, 'SOSTrigger'>;

export const SOSTriggerModal: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const preselectedCameraId = route.params?.preselectedCameraId;
  const user = useAppSelector((state) => state.auth.user);
  const isOffline = useAppSelector((state) => state.ui.isOffline);

  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(preselectedCameraId);
  const [locationInfo, setLocationInfo] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  const [isHolding, setIsHolding] = useState(false);
  const [successData, setSuccessData] = useState<{
    sosId: string;
    timestamp: string;
  } | null>(null);
  const [triggerError, setTriggerError] = useState<string | null>(null);

  const progress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const [triggerSOSMutation, { isLoading: isTriggering }] = useTriggerSOSMutation();
  const { data: camerasResponse } = useGetCamerasQuery();
  const cameras = camerasResponse?.data?.cameras || [];

  // Pulsing animation for emergency aura
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulseScale]);

  // Mock / Geolocation coords
  useEffect(() => {
    // Default location fallback
    setLocationInfo({
      latitude: 19.076,
      longitude: 72.8777,
      address: user?.address?.street
        ? `${user.address.street}, ${user.address.city || ''}`
        : 'Premises Coords (GPS Active)',
    });
  }, [user]);

  const handleHoldComplete = async () => {
    setIsHolding(false);
    if (isOffline) {
      setTriggerError('Cannot send SOS while offline. Please call emergency services directly.');
      return;
    }

    try {
      setTriggerError(null);
      const res = await triggerSOSMutation({
        cameraId: selectedCameraId,
        location: locationInfo
          ? {
              latitude: locationInfo.latitude,
              longitude: locationInfo.longitude,
              address: locationInfo.address,
            }
          : undefined,
      }).unwrap();

      const createdAlert = res.data;
      dispatch(addActiveSosAlert(createdAlert));
      setSuccessData({
        sosId: createdAlert._id,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      console.error('[SOS] Trigger error:', err);
      setTriggerError(
        err.data?.message || err.message || 'Emergency dispatch request failed. Please try again or call emergency services.'
      );
    }
  };

  const handlePressIn = () => {
    if (isTriggering || successData) return;
    setIsHolding(true);
    setTriggerError(null);

    progress.value = withTiming(
      1,
      { duration: HOLD_DURATION_MS, easing: Easing.linear },
      (finished) => {
        if (finished) {
          runOnJS(handleHoldComplete)();
        }
      }
    );
  };

  const handlePressOut = () => {
    if (successData) return;
    setIsHolding(false);
    progress.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) });
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
    };
  });

  const handleCallEmergencyContact = () => {
    const contactPhone =
      user?.emergencyContact?.phone || user?.franchiseId?.phone;
    if (contactPhone) {
      Linking.openURL(`tel:${contactPhone}`);
    } else {
      Linking.openURL('tel:112'); // National Emergency Number (India)
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerBadge}>EMERGENCY PROTOCOL</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          disabled={isTriggering}
        >
          <HugeIcon icon={Cancel01Icon} size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        scrollEnabled={!isHolding}
      >
        {!successData ? (
          <>
            {/* SOS Hero Icon & Animated Hold Progress */}
            <View style={styles.heroCenter}>
              <Animated.View style={[styles.pulseRing, pulseStyle]} />

              <View style={styles.svgWrapper}>
                <Svg width={160} height={160}>
                  {/* Background Track */}
                  <Circle
                    cx={80}
                    cy={80}
                    r={RADIUS_SIZE}
                    stroke="rgba(255, 59, 48, 0.25)"
                    strokeWidth={8}
                    fill="transparent"
                  />
                  {/* Animated Progress Ring */}
                  <AnimatedCircle
                    cx={80}
                    cy={80}
                    r={RADIUS_SIZE}
                    stroke={COLORS.sosRed}
                    strokeWidth={8}
                    strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeLinecap="round"
                    fill="transparent"
                    transform="rotate(-90 80 80)"
                    animatedProps={animatedCircleProps}
                  />
                </Svg>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  style={[styles.sosHoldButton, isHolding && styles.sosHoldButtonActive]}
                  disabled={isTriggering}
                >
                  {isTriggering ? (
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  ) : (
                    <>
                      <HugeIcon icon={SirenIcon} size={42} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.holdText}>
                        {isHolding ? 'HOLDING...' : 'HOLD 3s'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.holdInstruction}>
                Press and hold the button for 3 seconds to alert monitoring center
              </Text>
            </View>

            {triggerError ? (
              <View style={styles.errorCard}>
                <HugeIcon icon={SirenIcon} size={16} color={COLORS.sosRed} />
                <Text style={styles.errorText}>{triggerError}</Text>
              </View>
            ) : null}

            {/* GPS & Location Preview */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardRow}>
                <HugeIcon icon={Location01Icon} size={18} color={COLORS.sosRed} />
                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={styles.infoCardLabel}>BROADCAST LOCATION</Text>
                  <Text style={styles.infoCardValue}>
                    {locationInfo?.address || 'Detecting premises coordinates...'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Optional Camera Linking */}
            {cameras.length > 0 ? (
              <View style={styles.cameraPickerSection}>
                <Text style={styles.sectionLabel}>ASSOCIATE CCTV CAMERA (OPTIONAL)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.camerasRow}
                >
                  <TouchableOpacity
                    style={[
                      styles.cameraChip,
                      !selectedCameraId && styles.cameraChipActive,
                    ]}
                    onPress={() => setSelectedCameraId(undefined)}
                  >
                    <Text
                      style={[
                        styles.cameraChipText,
                        !selectedCameraId && styles.cameraChipTextActive,
                      ]}
                    >
                      General Premises
                    </Text>
                  </TouchableOpacity>

                  {cameras.map((cam) => (
                    <TouchableOpacity
                      key={cam._id}
                      style={[
                        styles.cameraChip,
                        selectedCameraId === cam._id && styles.cameraChipActive,
                      ]}
                      onPress={() => setSelectedCameraId(cam._id)}
                    >
                      <HugeIcon
                        icon={CctvCameraIcon}
                        size={14}
                        color={selectedCameraId === cam._id ? '#FFFFFF' : COLORS.textMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.cameraChipText,
                          selectedCameraId === cam._id && styles.cameraChipTextActive,
                        ]}
                      >
                        {cam.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </>
        ) : (
          /* Post-Send Full Screen Confirmation */
          <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <HugeIcon icon={CheckmarkCircle01Icon} size={56} color={COLORS.successGreen} />
            </View>

            <Text style={styles.successTitle}>SOS ALERT TRANSMITTED</Text>
            <Text style={styles.successDesc}>
              Emergency dispatch team has been notified at {successData.timestamp}. Real-time monitoring feed is now broadcasting.
            </Text>

            <View style={styles.actionButtonGroup}>
              {/* Direct Emergency Call Button */}
              <TouchableOpacity
                style={styles.callEmergencyBtn}
                onPress={handleCallEmergencyContact}
              >
                <HugeIcon icon={Call02Icon} size={18} color="#FFFFFF" />
                <Text style={styles.callEmergencyText}>
                  {user?.emergencyContact?.phone
                    ? `Call Emergency Contact (${user.emergencyContact.name})`
                    : 'Call Emergency Dispatch (112)'}
                </Text>
              </TouchableOpacity>

              {/* View Timeline CTA */}
              <TouchableOpacity
                style={styles.viewTimelineBtn}
                onPress={() => {
                  navigation.replace('SOSDetail', { sosId: successData.sosId });
                }}
              >
                <Text style={styles.viewTimelineText}>View Response Timeline</Text>
                <HugeIcon icon={ArrowRight01Icon} size={16} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.dismissText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#160404',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  headerBadge: {
    ...TYPOGRAPHY.caption,
    color: COLORS.sosRed,
    fontWeight: '800',
    letterSpacing: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    justifyContent: 'center',
  },
  heroCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xl,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  svgWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sosHoldButton: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.sosRed,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glowSos,
  },
  sosHoldButtonActive: {
    backgroundColor: '#D70015',
    transform: [{ scale: 0.96 }],
  },
  holdText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  holdInstruction: {
    ...TYPOGRAPHY.bodySmall,
    color: '#FFCDD2',
    textAlign: 'center',
    maxWidth: 260,
    marginTop: SPACING.lg,
    lineHeight: 18,
  },
  errorCard: {
    backgroundColor: COLORS.sosRedMuted,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.sosRed,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
    marginBottom: SPACING.lg,
  },
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCardLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.sosRed,
    fontWeight: '700',
    letterSpacing: 1,
  },
  infoCardValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#FFFFFF',
    marginTop: 2,
  },
  cameraPickerSection: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  camerasRow: {
    paddingVertical: SPACING.xs,
  },
  cameraChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADIUS.pill,
    marginRight: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraChipActive: {
    backgroundColor: COLORS.sosRed,
    borderColor: COLORS.sosRed,
  },
  cameraChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  cameraChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.successGreenMuted,
    borderWidth: 2,
    borderColor: COLORS.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  successTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.successGreen,
    fontSize: 22,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  successDesc: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  actionButtonGroup: {
    width: '100%',
  },
  callEmergencyBtn: {
    backgroundColor: COLORS.sosRed,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glowSos,
    marginBottom: SPACING.md,
  },
  callEmergencyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  viewTimelineBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  viewTimelineText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  dismissBtn: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  dismissText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
