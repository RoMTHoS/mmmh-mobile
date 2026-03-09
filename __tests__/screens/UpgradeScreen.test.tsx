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

const mockMutate = jest.fn();
let mockPlanStatus: Record<string, unknown> | null = {
  tier: 'free',
  canUsePremium: false,
  vpsQuotaRemaining: 5,
  geminiQuotaRemaining: 0,
  storeSubscription: null,
};

jest.mock('../../src/hooks', () => ({
  usePlanStatus: () => mockPlanStatus,
  useActivatePremium: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

jest.mock('../../src/utils/analytics', () => ({
  trackEvent: jest.fn(),
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

    it('renders "Voir les offres" button', () => {
      const { getByText } = render(React.createElement(UpgradeScreen));

      expect(getByText('Voir les offres')).toBeDefined();
    });
  });

  describe('promo code section', () => {
    const openPromoSection = (getByText: ReturnType<typeof render>['getByText']) => {
      fireEvent.press(getByText('Voir les offres'));
      fireEvent.press(getByText('Vous avez un code promo ?'));
    };

    it('renders promo code input', () => {
      const { getByText, getByPlaceholderText } = render(React.createElement(UpgradeScreen));

      openPromoSection(getByText);

      expect(getByText('Entrez votre code promo')).toBeDefined();
      expect(getByPlaceholderText('MMMH-BETA-2026')).toBeDefined();
    });

    it('shows error for empty code', () => {
      const { getByText } = render(React.createElement(UpgradeScreen));

      openPromoSection(getByText);

      // Press Activer without entering any code
      fireEvent.press(getByText('Activer'));

      expect(getByText('Code promo requis')).toBeDefined();
    });

    it('calls activatePremium with valid code', () => {
      const { getByText, getByPlaceholderText } = render(React.createElement(UpgradeScreen));

      openPromoSection(getByText);

      fireEvent.changeText(getByPlaceholderText('MMMH-BETA-2026'), 'MMMH-BETA-2026');
      fireEvent.press(getByText('Activer'));

      expect(mockMutate).toHaveBeenCalledWith('MMMH-BETA-2026', expect.any(Object));
    });
  });

  describe('premium active state', () => {
    it('shows active card when already premium', () => {
      mockPlanStatus = { ...mockPlanStatus, tier: 'premium' };

      const { getByTestId, getByText } = render(React.createElement(UpgradeScreen));

      expect(getByTestId('premium-active-card')).toBeDefined();
      expect(getByText('Premium actif')).toBeDefined();
    });

    it('does not show promo section when premium', () => {
      mockPlanStatus = { ...mockPlanStatus, tier: 'premium' };

      const { queryByText } = render(React.createElement(UpgradeScreen));

      expect(queryByText('Voir les offres')).toBeNull();
      expect(queryByText('Vous avez un code promo ?')).toBeNull();
    });
  });
});
