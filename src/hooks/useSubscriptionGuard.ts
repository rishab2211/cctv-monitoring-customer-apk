import { useMemo } from 'react';
import { useGetCustomerSubscriptionQuery } from '../features/billing/billingApi';
import { SubscriptionStatus } from '../types';

export type PaywallType = 'upgrade' | 'pay_now' | null;

interface UseSubscriptionGuardOptions {
  statusOverride?: SubscriptionStatus | string;
  skipFetch?: boolean;
}

export const useSubscriptionGuard = (options?: UseSubscriptionGuardOptions) => {
  const { data: subResponse, isLoading } = useGetCustomerSubscriptionQuery(undefined, {
    skip: !!options?.skipFetch,
  });

  const sub = subResponse?.data;
  const fetchedStatus = sub?.status as SubscriptionStatus | undefined;

  // Status precedence: explicit override > fetched active subscription status > 'inactive'
  const currentStatus: SubscriptionStatus | string =
    options?.statusOverride || fetchedStatus || 'inactive';

  const { canStream, paywallType } = useMemo(() => {
    if (currentStatus === 'active') {
      return { canStream: true, paywallType: null };
    }
    if (currentStatus === 'past_due') {
      return { canStream: false, paywallType: 'pay_now' as PaywallType };
    }
    // 'canceled', 'expired', 'inactive', 'pending_payment', or unconfigured
    return { canStream: false, paywallType: 'upgrade' as PaywallType };
  }, [currentStatus]);

  const guardAction = (
    onAllowed: () => void,
    onBlocked?: (paywall: PaywallType) => void
  ) => {
    if (canStream) {
      onAllowed();
    } else {
      if (onBlocked) {
        onBlocked(paywallType);
      }
    }
  };

  return {
    canStream,
    paywallType,
    currentStatus,
    guardAction,
    isLoadingSubscription: isLoading,
    subscription: sub,
  };
};

