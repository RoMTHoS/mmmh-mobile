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
    it('renders promo code input', () => {
      const { getByTestId } = render(React.createElement(UpgradeScreen));

      expect(getByTestId('promo-section')).toBeDefined();
      expect(getByTestId('promo-input')).toBeDefined();
    });

    it('shows error for empty code', () => {
      const { getByText, getByTestId } = render(React.createElement(UpgradeScreen));

      // Set a short code
      fireEvent.changeText(getByTestId('promo-input'), 'AB');
      fireEvent.press(getByText('Activer'));

      expect(getByTestId('promo-error')).toBeDefined();
    });

    it('calls activatePremium with valid code', () => {
      const { getByText, getByTestId } = render(React.createElement(UpgradeScreen));

      fireEvent.changeText(getByTestId('promo-input'), 'MMMH-BETA-2026');
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

      const { queryByTestId } = render(React.createElement(UpgradeScreen));

      expect(queryByTestId('promo-section')).toBeNull();
    });
  });
});
