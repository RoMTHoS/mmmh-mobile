import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOfferings,
  purchaseMonthlySubscription,
  restorePurchases,
} from '../services/revenueCat';
import { syncActivateFromStore } from '../services/planSync';
import { analytics } from '../services/analytics';
import { EVENTS } from '../utils/analyticsEvents';

const OFFERINGS_KEY = ['offerings'];
const USER_PLAN_KEY = ['user-plan'];

export function useOfferings() {
  const query = useQuery({
    queryKey: OFFERINGS_KEY,
    queryFn: getOfferings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const priceString = query.data?.current?.monthly?.product.priceString ?? null;

  return {
    offerings: query.data,
    priceString,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function usePurchaseSubscription() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: purchaseMonthlySubscription,
    onSuccess: async (result) => {
      if (result.success && result.customerInfo) {
        await syncActivateFromStore(result.customerInfo);
        queryClient.invalidateQueries({ queryKey: USER_PLAN_KEY });

        const product = result.customerInfo.entitlements.active['premium'];
        analytics.track(EVENTS.PURCHASE_COMPLETED, {
          productId: product?.productIdentifier ?? '',
        });
      } else if (result.userCancelled) {
        analytics.track(EVENTS.PURCHASE_CANCELLED);
      } else {
        analytics.track(EVENTS.PURCHASE_FAILED, { error: result.error ?? '' });
      }
    },
  });

  return {
    purchase: mutation.mutateAsync,
    isPurchasing: mutation.isPending,
    error: mutation.error,
    result: mutation.data,
  };
}

export function useRestorePurchases() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: restorePurchases,
    onSuccess: async (result) => {
      if (result.restored && result.customerInfo) {
        await syncActivateFromStore(result.customerInfo);
        queryClient.invalidateQueries({ queryKey: USER_PLAN_KEY });
        analytics.track(EVENTS.RESTORE_COMPLETED);
      } else {
        analytics.track(EVENTS.RESTORE_NOT_FOUND);
      }
    },
  });

  return {
    restore: mutation.mutateAsync,
    isRestoring: mutation.isPending,
    result: mutation.data,
  };
}
