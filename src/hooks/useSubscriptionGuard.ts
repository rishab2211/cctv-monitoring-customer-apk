import { useMemo } from 'react';
import { useAppSelector } from './redux';

export type PaywallType = 'upgrade' | 'pay_now' | null;

interface UseSubscriptionGuardOptions {
  statusOverride?: string;
}

export const useSubscriptionGuard = (options?: UseSubscriptionGuardOptions) => {
  // In later phases, subscription will also be synced from RTK query cache / dashboard endpoint
  const user = useAppSelector((state) => state.auth.user);

  // Status can come from props override or customer's cached status
  const currentStatus = options?.statusOverride || 'active'; // default optimistic for unconfigured mocks, strictly checked against 'active'

  const { canStream, paywallType } = useMemo(() => {
    if (currentStatus === 'active') {
      return { canStream: true, paywallType: null };
    }
    if (currentStatus === 'past_due') {
      return { canStream: false, paywallType: 'pay_now' as PaywallType };
    }
    // 'canceled', 'expired', 'pending_payment', or undefined
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
  };
};
