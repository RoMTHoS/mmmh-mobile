import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock dependencies before importing component
jest.mock('expo-router', () => ({
  Stack: { Screen: ({ children }: { children: React.ReactNode }) => children },
  router: { back: jest.fn(), push: jest.fn() },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
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

  describe('comparison table', () => {
    it('renders comparison table', () => {
      const { getByTestId, getByText } = render(React.createElement(UpgradeScreen));

      expect(getByTestId('comparison-table')).toBeDefined();
      expect(getByText('Gratuit')).toBeDefined();
      expect(getByText('Premium')).toBeDefined();
      expect(getByText('Imports par semaine')).toBeDefined();
    });

    it('shows all comparison rows', () => {
      const { getByText } = render(React.createElement(UpgradeScreen));

      expect(getByText('10')).toBeDefined();
      expect(getByText('Illimite')).toBeDefined();
      expect(getByText('Excellente')).toBeDefined();
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

    it('does not show comparison table when premium', () => {
      mockPlanStatus = { ...mockPlanStatus, tier: 'premium' };

      const { queryByTestId } = render(React.createElement(UpgradeScreen));

      expect(queryByTestId('comparison-table')).toBeNull();
      expect(queryByTestId('promo-section')).toBeNull();
    });
  });

  describe('benefits section', () => {
    it('renders three benefits', () => {
      const { getByText } = render(React.createElement(UpgradeScreen));

      expect(getByText('Qualite Premium')).toBeDefined();
      expect(getByText('Imports illimites')).toBeDefined();
      expect(getByText('Videos completes')).toBeDefined();
    });
  });
});
