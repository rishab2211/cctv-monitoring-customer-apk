import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CheckmarkCircle01Icon,
  StarIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import {
  useGetPlansQuery,
  useGetCustomerSubscriptionQuery,
  useCreateSubscriptionMutation,
  Plan,
} from './billingApi';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanSelection'>;

// Default / fallback plan tiers matching PRD §8.6 (defined outside component to stabilize references)
const FALLBACK_PLANS: Plan[] = [
  {
    _id: 'plan-basic',
    name: 'Basic Surveillance',
    price: 499,
    currency: 'INR',
    billingCycle: 'monthly',
    features: [
      'Live HD WebRTC Streaming',
      '7-Day Cloud Video Storage',
      'Standard Motion Alerts',
      'Single User Access',
    ],
  },
  {
    _id: 'plan-premium',
    name: 'Premium Protection',
    price: 999,
    currency: 'INR',
    billingCycle: 'monthly',
    isPopular: true,
    features: [
      'Live Full HD Streaming',
      '30-Day Cloud Video Storage',
      '24/7 AI Human & Vehicle Detection',
      'Priority Emergency SOS Dispatch',
      'Multi-Viewer Camera Sharing',
    ],
  },
  {
    _id: 'plan-ai-pro',
    name: 'AI-Pro Security',
    price: 1999,
    currency: 'INR',
    billingCycle: 'monthly',
    features: [
      '4K Ultra HD Streaming',
      '90-Day Cloud Video Storage',
      'Facial Recognition & Perimeter AI',
      'Dedicated Franchise Emergency Dispatch',
      'Unlimited Viewer Sharing & Downloads',
    ],
  },
];

export const PlanSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { data: plansResponse, isLoading: isLoadingPlans } = useGetPlansQuery();
  const { data: subResponse } = useGetCustomerSubscriptionQuery();
  const [createSubscriptionMutation, { isLoading: isCreating }] = useCreateSubscriptionMutation();

  const activeSub = subResponse?.data;
  const activePlanId =
    typeof activeSub?.planId === 'object' && activeSub.planId !== null
      ? activeSub.planId._id
      : activeSub?.planId;

  const plans = React.useMemo(() => {
    const fetchedPlans = plansResponse?.data?.plans;
    if (Array.isArray(fetchedPlans) && fetchedPlans.length > 0) {
      return fetchedPlans;
    }
    if (Array.isArray(plansResponse?.data) && plansResponse.data.length > 0) {
      return plansResponse.data as Plan[];
    }
    return FALLBACK_PLANS;
  }, [plansResponse]);

  const handleSelectPlan = async (plan: Plan) => {
    if (activeSub?.status === 'active' && activePlanId === plan._id) {
      Alert.alert('Current Plan', 'You are already actively subscribed to this plan.');
      return;
    }

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(plan._id);

    if (!isMongoId) {
      // In offline/sandbox fallback mode when using client fallback mock plan IDs
      navigation.navigate('Payment', {
        planId: plan._id,
        amount: plan.price,
        subscriptionId: `sub_${Date.now()}`,
      });
      return;
    }

    try {
      const res = await createSubscriptionMutation({ planId: plan._id }).unwrap();
      const subscriptionId = res?.data?.subscription?._id || `sub_${Date.now()}`;

      navigation.navigate('Payment', {
        planId: plan._id,
        amount: plan.price,
        subscriptionId,
      });
    } catch (err: any) {
      console.warn('[PlanSelection] Error creating subscription on backend:', err);
      // Fallback navigation with client-generated id for seamless sandbox testing
      navigation.navigate('Payment', {
        planId: plan._id,
        amount: plan.price,
        subscriptionId: `sub_${Date.now()}`,
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Security Plan</Text>
          <Text style={styles.subtitle}>
            Select the cloud storage & surveillance coverage tailored to your premises
          </Text>
        </View>

        {isLoadingPlans ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading available security tiers...</Text>
          </View>
        ) : (
          plans.map((plan) => {
            const isCurrent = activeSub?.status === 'active' && activePlanId === plan._id;
            const isPopular = plan.isPopular || plan.name.toLowerCase().includes('premium');

            return (
              <View
                key={plan._id}
                style={[
                  styles.planCard,
                  isPopular && styles.planCardPopular,
                  isCurrent && styles.planCardCurrent,
                ]}
              >
                {isPopular ? (
                  <View style={styles.popularBadge}>
                    <HugeIcon icon={StarIcon} size={12} color="#000000" />
                    <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                  </View>
                ) : null}

                {isCurrent ? (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
                  </View>
                ) : null}

                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceCurrency}>₹</Text>
                    <Text style={styles.priceAmount}>{plan.price}</Text>
                    <Text style={styles.priceCycle}>/ month</Text>
                  </View>
                </View>

                {/* Features List */}
                <View style={styles.featuresList}>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <HugeIcon
                        icon={CheckmarkCircle01Icon}
                        size={16}
                        color={COLORS.successGreen}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Action CTA */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.selectButton,
                    isPopular && styles.selectButtonPopular,
                    isCurrent && styles.selectButtonCurrent,
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                  disabled={isCreating || isCurrent}
                >
                  {isCreating ? (
                    <ActivityIndicator color={COLORS.textInverse} />
                  ) : (
                    <Text
                      style={[
                        styles.selectButtonText,
                        isCurrent && styles.selectButtonTextCurrent,
                      ]}
                    >
                      {isCurrent ? 'Active Subscription' : 'Select Plan & Pay'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  planCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  planCardPopular: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 198, 174, 0.04)',
    ...SHADOWS.glowTeal,
  },
  planCardCurrent: {
    borderColor: COLORS.successGreen,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 3,
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: COLORS.successGreen,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  currentBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  planHeader: {
    marginBottom: SPACING.lg,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 2,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  priceCycle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  featuresList: {
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  selectButton: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.button,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  selectButtonPopular: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.glowTeal,
  },
  selectButtonCurrent: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderColor: COLORS.successGreen,
  },
  selectButtonText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  selectButtonTextCurrent: {
    color: COLORS.successGreen,
  },
  centerLoading: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});
