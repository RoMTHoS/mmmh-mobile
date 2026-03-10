import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

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
  Stack: { Screen: ({ children }: { children: React.ReactNode }) => children },
  router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock('../../src/utils/toast', () => ({
  Toast: { show: jest.fn() },
}));

const mockPromoMutate = jest.fn();
const mockPurchase = jest.fn().mockResolvedValue({ success: true, customerInfo: {} });
const mockRestore = jest.fn().mockResolvedValue({ restored: false });

let mockPlanStatus: Record<string, unknown> | null = {
  tier: 'free',
  canUsePremium: false,
  vpsQuotaRemaining: 5,
  geminiQuotaRemaining: 0,
  storeSubscription: null,
};

let mockPriceString: string | null = '4,99 €';
let mockOfferingsLoading = false;
let mockOfferingsError: Error | null = null;

jest.mock('../../src/hooks', () => ({
  usePlanStatus: () => mockPlanStatus,
  useActivatePremium: () => ({
    mutate: mockPromoMutate,
    isPending: false,
  }),
  useOfferings: () => ({
    offerings: mockPriceString
      ? { current: { monthly: { product: { priceString: mockPriceString } } } }
      : null,
    priceString: mockPriceString,
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

jest.mock('../../src/utils/analytics', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('../../src/services/analytics', () => ({
  analytics: { track: jest.fn() },
}));

jest.mock('../../src/utils/analyticsEvents', () => ({
  EVENTS: {
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
    mockPriceString = '4,99 €';
    mockOfferingsLoading = false;
    mockOfferingsError = null;
  });

  describe('branding and benefits', () => {
    it('renders MMMH PREMIUM branding', () => {
      const { getByText } = render(React.createElement(UpgradeScreen));
      expect(getByText('PREMIUM')).toBeDefined();
    });

    it('renders benefit bullets', () => {
      const { getByText } = render(React.createElement(UpgradeScreen));
      expect(getByText(/Importe tes recettes en illimité/)).toBeDefined();
      expect(getByText(/Sauvegarde tes recettes dans le cloud/)).toBeDefined();
      expect(getByText(/IA plus performante/)).toBeDefined();
    });
  });

  describe('store subscription', () => {
    it('renders subscribe button with price', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      const button = getByTestId('subscribe-button');
      expect(button).toBeDefined();
    });

    it('displays localized price from offerings', () => {
      const { getByText } = render(React.createElement(UpgradeScreen));
      expect(getByText("S'abonner — 4,99 €/mois")).toBeDefined();
    });

    it('shows fallback text when no price available', () => {
      mockPriceString = null;
      const { getByText } = render(React.createElement(UpgradeScreen));
      expect(getByText("S'abonner")).toBeDefined();
    });

    it('triggers purchase on subscribe press', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('subscribe-button'));
      expect(mockPurchase).toHaveBeenCalled();
    });

    it('shows offerings error with retry', () => {
      mockOfferingsError = new Error('Network');
      const { getByText, getByTestId } = render(React.createElement(UpgradeScreen));
      expect(getByText(/Les offres ne sont pas disponibles/)).toBeDefined();
      expect(getByTestId('retry-offerings')).toBeDefined();
    });
  });

  describe('restore purchases', () => {
    it('renders restore button', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      expect(getByTestId('restore-button')).toBeDefined();
    });

    it('triggers restore on press', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('restore-button'));
      expect(mockRestore).toHaveBeenCalled();
    });
  });

  describe('promo code section', () => {
    it('renders promo code toggle', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      expect(getByTestId('promo-toggle')).toBeDefined();
    });

    it('expands promo input on toggle', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('promo-toggle'));
      expect(getByTestId('promo-input')).toBeDefined();
    });

    it('shows error for empty code', () => {
      const { getByTestId, getByText } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('promo-toggle'));
      fireEvent.press(getByTestId('promo-activate'));
      expect(getByText('Code promo requis')).toBeDefined();
    });

    it('calls activatePremium with valid code', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));
      fireEvent.press(getByTestId('promo-toggle'));
      fireEvent.changeText(getByTestId('promo-input'), 'MMMH-BETA-2026');
      fireEvent.press(getByTestId('promo-activate'));
      expect(mockPromoMutate).toHaveBeenCalledWith('MMMH-BETA-2026', expect.any(Object));
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

  describe('subscription terms', () => {
    it('displays terms text', () => {
      const { getByText } = render(React.createElement(UpgradeScreen));
      expect(getByText(/Abonnement mensuel/)).toBeDefined();
    });
  });
});
