import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

// Mock dependencies before importing component
jest.mock('react-native-svg', () => {
  const RN = jest.requireActual('react');
  const mock = (name: string) => (props: Record<string, unknown>) =>
    RN.createElement('View', { testID: `svg-${name}` }, props.children as React.ReactNode);
  return {
    __esModule: true,
    default: mock('Svg'),
    Svg: mock('Svg'),
    Path: mock('Path'),
    Ellipse: mock('Ellipse'),
  };
});

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options?: { headerLeft?: () => React.ReactNode } }) =>
      options?.headerLeft ? options.headerLeft() : null,
  },
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('../../src/utils/toast', () => ({
  Toast: { show: jest.fn() },
}));

const mockPurchase = jest.fn().mockResolvedValue({ success: true, customerInfo: {} });
const mockRestore = jest.fn().mockResolvedValue({ restored: false });

let mockPlanStatus: Record<string, unknown> | null = {
  tier: 'free',
  canUsePremium: false,
  vpsQuotaRemaining: 5,
  geminiQuotaRemaining: 0,
  storeSubscription: null,
};

let mockMonthlyPriceString: string | null = '4,99 €';
let mockAnnualPriceString: string | null = '49,99 €';
let mockOfferingsLoading = false;
let mockOfferingsError: Error | null = null;

jest.mock('../../src/hooks', () => ({
  usePlanStatus: () => mockPlanStatus,
  useOfferings: () => ({
    offerings: mockMonthlyPriceString
      ? {
          current: {
            monthly: { product: { priceString: mockMonthlyPriceString } },
            annual: { product: { priceString: mockAnnualPriceString } },
          },
        }
      : null,
    priceString: mockMonthlyPriceString,
    monthlyPriceString: mockMonthlyPriceString,
    annualPriceString: mockAnnualPriceString,
    isLoading: mockOfferingsLoading,
    error: mockOfferingsError,
    refetch: jest.fn(),
  }),
  usePurchaseSubscription: () => ({
    purchase: mockPurchase,
    isPurchasing: false,
    error: null,
    result: null,
  }),
  useRestorePurchases: () => ({
    restore: mockRestore,
    isRestoring: false,
    result: null,
  }),
}));

const mockAnalyticsTrack = jest.fn();
jest.mock('../../src/services/analytics', () => ({
  analytics: { track: (...args: unknown[]) => mockAnalyticsTrack(...args) },
}));

jest.mock('../../src/utils/analyticsEvents', () => ({
  EVENTS: {
    PAYWALL_VIEWED: 'Paywall Viewed',
    PURCHASE_INITIATED: 'Purchase Initiated',
    PURCHASE_COMPLETED: 'Purchase Completed',
    PURCHASE_CANCELLED: 'Purchase Cancelled',
    PURCHASE_FAILED: 'Purchase Failed',
    RESTORE_INITIATED: 'Restore Initiated',
    RESTORE_COMPLETED: 'Restore Completed',
    RESTORE_NOT_FOUND: 'Restore Not Found',
  },
}));

import UpgradeScreen from '../../app/upgrade';

describe('UpgradeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlanStatus = {
      tier: 'free',
      canUsePremium: false,
      vpsQuotaRemaining: 5,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    };
    mockMonthlyPriceString = '4,99 €';
    mockAnnualPriceString = '49,99 €';
    mockOfferingsLoading = false;
    mockOfferingsError = null;
  });

  describe('branding and benefits', () => {
    it('renders MMMH PREMIUM branding', () => {
      const { getByText } = render(React.createElement(UpgradeScreen));
      expect(getByText('PREMIUM')).toBeDefined();
    });

    it('renders premium benefits list with all 6 bullets', () => {
      const { getByTestId, getByText } = render(React.createElement(UpgradeScreen));
      expect(getByTestId('premium-benefits')).toBeDefined();
      expect(getByText('Importation instantanée et illimitée')).toBeDefined();
      expect(getByText('Détection complète des ingrédients')).toBeDefined();
      expect(getByText('Quantités et unités ultra précises')).toBeDefined();
      expect(getByText('File prioritaire')).toBeDefined();
      expect(getByText('Plans de repas intelligents')).toBeDefined();
      expect(getByText('Listes de courses automatiques')).toBeDefined();
    });
  });

  describe('main screen CTA', () => {
    it('renders "Voir les offres" button', () => {
      const { getByTestId, getByText } = render(React.createElement(UpgradeScreen));
      expect(getByTestId('subscribe-button')).toBeDefined();
      expect(getByText('Voir les offres')).toBeDefined();
    });

    it('shows offerings error with retry', () => {
      mockOfferingsError = new Error('Network');
      const { getByText, getByTestId } = render(React.createElement(UpgradeScreen));
      expect(getByText(/Les offres ne sont pas disponibles/)).toBeDefined();
      expect(getByTestId('retry-offerings')).toBeDefined();
    });
  });

  describe('offers modal', () => {
    it('opens modal on "Voir les offres" press', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('subscribe-button'));
      expect(getByTestId('plan-card-annual')).toBeDefined();
      expect(getByTestId('plan-card-monthly')).toBeDefined();
    });

    it('displays plan cards with prices in modal', () => {
      const { getByTestId, getByText } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('subscribe-button'));
      expect(getByText('Annuel')).toBeDefined();
      expect(getByText('Mensuel')).toBeDefined();
      expect(getByText(/49,99 € \/ an/)).toBeDefined();
      expect(getByText(/4,99 € \/ mois/)).toBeDefined();
    });

    it('triggers purchase on Continuer press', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('subscribe-button'));
      fireEvent.press(getByTestId('continue-purchase-button'));
      expect(mockPurchase).toHaveBeenCalled();
    });

    it('renders restore button in modal', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('subscribe-button'));
      expect(getByTestId('restore-button')).toBeDefined();
    });

    it('triggers restore on press', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('subscribe-button'));
      fireEvent.press(getByTestId('restore-button'));
      expect(mockRestore).toHaveBeenCalled();
    });

    it('displays terms text in modal', () => {
      const { getByTestId, getByText } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('subscribe-button'));
      expect(getByText(/Abonnement annuel/)).toBeDefined();
    });
  });

  describe('promo code removed', () => {
    it('does not render the promo toggle', () => {
      const { queryByTestId } = render(React.createElement(UpgradeScreen));
      expect(queryByTestId('promo-toggle')).toBeNull();
      expect(queryByTestId('promo-modal')).toBeNull();
    });
  });

  describe('premium active state', () => {
    it('shows active card when already premium', () => {
      mockPlanStatus = { ...mockPlanStatus, tier: 'premium' };
      const { getByTestId, getByText } = render(React.createElement(UpgradeScreen));
      expect(getByTestId('premium-active-card')).toBeDefined();
      expect(getByText('Premium actif')).toBeDefined();
    });

    it('shows subscription info when store premium', () => {
      mockPlanStatus = {
        ...mockPlanStatus,
        tier: 'premium',
        storeSubscription: {
          isActive: true,
          willRenew: true,
          expirationDate: '2026-04-10T00:00:00Z',
          subscriptionStatus: 'active',
        },
      };
      const { getByText } = render(React.createElement(UpgradeScreen));
      expect(getByText(/Renouvellement le/)).toBeDefined();
    });

    it('does not show subscribe/promo when premium', () => {
      mockPlanStatus = { ...mockPlanStatus, tier: 'premium' };
      const { queryByTestId } = render(React.createElement(UpgradeScreen));
      expect(queryByTestId('subscribe-button')).toBeNull();
      expect(queryByTestId('promo-toggle')).toBeNull();
    });
  });

  describe('from=onboarding', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (useLocalSearchParams as jest.Mock).mockReturnValue({ from: 'onboarding' });
    });

    afterEach(() => {
      jest.useRealTimers();
      (useLocalSearchParams as jest.Mock).mockReturnValue({});
    });

    it('tracks PAYWALL_VIEWED with source=onboarding once on mount', () => {
      render(React.createElement(UpgradeScreen));
      const paywallViewedCalls = mockAnalyticsTrack.mock.calls.filter(
        (call) => call[0] === 'Paywall Viewed'
      );
      expect(paywallViewedCalls).toHaveLength(1);
      expect(paywallViewedCalls[0][1]).toEqual({ source: 'onboarding' });
    });

    it('routes to /(tabs) on back arrow tap', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('paywall-back'));
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      expect(router.back).not.toHaveBeenCalled();
    });

    it('routes to /(tabs) after purchase success', async () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('subscribe-button'));
      fireEvent.press(getByTestId('continue-purchase-button'));

      await waitFor(() => expect(mockPurchase).toHaveBeenCalled());
      jest.advanceTimersByTime(2000);

      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      expect(router.back).not.toHaveBeenCalled();
    });

    it('does not track PAYWALL_VIEWED when user is already premium', () => {
      mockPlanStatus = { ...mockPlanStatus, tier: 'premium' };
      render(React.createElement(UpgradeScreen));
      const paywallViewedCalls = mockAnalyticsTrack.mock.calls.filter(
        (call) => call[0] === 'Paywall Viewed'
      );
      expect(paywallViewedCalls).toHaveLength(0);
    });
  });
});
