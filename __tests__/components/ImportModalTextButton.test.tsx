import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// --- Mocks ---

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

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: mockRouterPush, replace: jest.fn(), back: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../src/components/ui', () => {
  const RN = jest.requireActual('react');
  return {
    Icon: (props: Record<string, unknown>) =>
      RN.createElement('View', { testID: `icon-${props.name}` }),
    PremiumIcon: (_props: Record<string, unknown>) =>
      RN.createElement('View', { testID: 'premium-icon' }),
    iconNames: {},
    iconSizes: {},
  };
});

let mockPlanStatus: Record<string, unknown> | null = {
  tier: 'free',
  vpsQuotaRemaining: 5,
  geminiQuotaRemaining: 0,
  storeSubscription: null,
};

jest.mock('../../src/hooks', () => ({
  usePlanStatus: () => mockPlanStatus,
}));

jest.mock('../../src/utils/analytics', () => ({
  trackEvent: jest.fn(),
}));

import { ImportModal } from '../../src/components/import/ImportModal';

describe('ImportModal - Text Button', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlanStatus = { tier: 'free', vpsQuotaRemaining: 5, geminiQuotaRemaining: 0 };
  });

  // 5.11 + 5.12 - "Texte" button navigates to /import/text
  it('navigates to /import/text when "Texte" button is pressed', () => {
    const { getByText } = render(<ImportModal visible={true} onClose={mockOnClose} />);

    const texteButton = getByText('Texte');
    fireEvent.press(texteButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith('/import/text');
  });
});
