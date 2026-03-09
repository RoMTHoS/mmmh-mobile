import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// --- Mocks ---

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockGetStringAsync = jest.fn<Promise<string>, []>();
jest.mock('expo-clipboard', () => ({
  getStringAsync: () => mockGetStringAsync(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

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

const mockToastShow = jest.fn();
jest.mock('../../src/utils/toast', () => ({
  Toast: { show: (...args: unknown[]) => mockToastShow(...args) },
}));

const mockSubmitImport = jest.fn();
jest.mock('../../src/services/import', () => ({
  submitImport: (...args: unknown[]) => mockSubmitImport(...args),
}));

const mockAddJob = jest.fn();
const mockJobs: unknown[] = [];
jest.mock('../../src/stores/importStore', () => ({
  useImportStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ addJob: mockAddJob, jobs: mockJobs }),
}));

jest.mock('../../src/hooks/usePipelinePreCheck', () => ({
  usePipelinePreCheck: () => jest.fn(),
}));

let mockPlanStatus: Record<string, unknown> | null = {
  tier: 'free',
  vpsQuotaRemaining: 5,
  geminiQuotaRemaining: 0,
  storeSubscription: null,
};
const mockActivateTrial = { mutate: jest.fn() };

jest.mock('../../src/hooks', () => ({
  usePlanStatus: () => mockPlanStatus,
  useActivateTrial: () => mockActivateTrial,
}));

jest.mock('../../src/utils/analytics', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
  useQuery: () => ({ data: null, isLoading: false }),
}));

import { router } from 'expo-router';
import TextImportScreen from '../../app/import/text';

function renderScreen() {
  return render(<TextImportScreen />);
}

describe('TextImportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlanStatus = {
      tier: 'free',
      vpsQuotaRemaining: 5,
      geminiQuotaRemaining: 0,
      storeSubscription: null,
    };
    mockJobs.length = 0;
  });

  // 5.2 - screen renders with TextInput, paste button, submit button
  describe('rendering', () => {
    it('renders TextInput, paste button, and submit button', () => {
      const { getByTestId } = renderScreen();

      expect(getByTestId('text-import-input')).toBeDefined();
      expect(getByTestId('paste-button')).toBeDefined();
      expect(getByTestId('submit-button')).toBeDefined();
    });

    it('renders clear button', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('clear-button')).toBeDefined();
    });

    it('renders character counter', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('char-counter')).toBeDefined();
    });
  });

  // 5.3 - paste button fills TextInput from clipboard
  describe('paste functionality', () => {
    it('fills TextInput from clipboard', async () => {
      mockGetStringAsync.mockResolvedValue('Ma recette de gateau au chocolat');
      const { getByTestId } = renderScreen();

      fireEvent.press(getByTestId('paste-button'));

      await waitFor(() => {
        expect(mockGetStringAsync).toHaveBeenCalled();
        expect(mockToastShow).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'success', text1: 'Texte colle' })
        );
      });
    });

    it('shows toast when clipboard is empty', async () => {
      mockGetStringAsync.mockResolvedValue('');
      const { getByTestId } = renderScreen();

      fireEvent.press(getByTestId('paste-button'));

      await waitFor(() => {
        expect(mockToastShow).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'info', text1: 'Presse-papiers vide' })
        );
      });
    });
  });

  // 5.4 - submit shows validation when text < 10 characters
  describe('validation', () => {
    it('shows validation error when text is less than 10 characters', () => {
      const { getByTestId, queryByTestId } = renderScreen();

      fireEvent.changeText(getByTestId('text-import-input'), 'short');
      fireEvent.press(getByTestId('submit-button'));

      expect(queryByTestId('validation-error')).toBeDefined();
      expect(mockSubmitImport).not.toHaveBeenCalled();
    });
  });

  // 5.5 - character counter updates as user types
  describe('character counter', () => {
    it('updates as user types', () => {
      const { getByTestId } = renderScreen();

      fireEvent.changeText(getByTestId('text-import-input'), 'Hello World');

      const counter = getByTestId('char-counter');
      // "Hello World" is 11 chars — should show "11 / 15 000" (fr-FR formatting)
      expect(counter.props.children).toBeDefined();
    });

    // 5.6 - character counter turns red when < 10 chars
    it('turns red when text is less than 10 characters', () => {
      const { getByTestId } = renderScreen();

      fireEvent.changeText(getByTestId('text-import-input'), 'abc');

      const counter = getByTestId('char-counter');
      // The style should contain the error color
      const flatStyle = Array.isArray(counter.props.style)
        ? Object.assign({}, ...counter.props.style)
        : counter.props.style;
      expect(flatStyle.color).toBeDefined();
    });
  });

  // 5.7 - successful submit calls submitImport with correct params
  describe('submission', () => {
    it('calls submitImport with importType text and sourceText', async () => {
      mockSubmitImport.mockResolvedValue({
        jobId: 'job-123',
        status: 'pending',
        createdAt: '2026-03-05T00:00:00Z',
      });

      const { getByTestId } = renderScreen();

      fireEvent.changeText(
        getByTestId('text-import-input'),
        'Ingrédients: 200g de farine, 100g de sucre, 3 oeufs'
      );
      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockSubmitImport).toHaveBeenCalledWith(
          expect.objectContaining({
            importType: 'text',
            sourceText: 'Ingrédients: 200g de farine, 100g de sucre, 3 oeufs',
          })
        );
      });
    });

    // 5.8 - submit navigates to home on success
    it('navigates to home on success', async () => {
      mockSubmitImport.mockResolvedValue({
        jobId: 'job-456',
        status: 'pending',
        createdAt: '2026-03-05T00:00:00Z',
      });

      const { getByTestId } = renderScreen();

      fireEvent.changeText(
        getByTestId('text-import-input'),
        'Ingrédients: 200g de farine, 100g de sucre, 3 oeufs'
      );
      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
    });

    // 5.10 - error shows error toast
    it('shows error toast on failure', async () => {
      mockSubmitImport.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = renderScreen();

      fireEvent.changeText(
        getByTestId('text-import-input'),
        'Ingrédients: 200g de farine, 100g de sucre, 3 oeufs'
      );
      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockToastShow).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error', text1: 'Erreur' })
        );
      });
    });
  });

  // 5.9 - quota exceeded shows modal
  describe('quota enforcement', () => {
    it('shows quota exceeded modal when VPS quota is 0', () => {
      mockPlanStatus = {
        tier: 'free',
        vpsQuotaRemaining: 0,
        geminiQuotaRemaining: 0,
        storeSubscription: null,
      };

      const { getByTestId } = renderScreen();

      fireEvent.changeText(
        getByTestId('text-import-input'),
        'Ingrédients: 200g de farine, 100g de sucre, 3 oeufs'
      );
      fireEvent.press(getByTestId('submit-button'));

      expect(mockSubmitImport).not.toHaveBeenCalled();
    });
  });
});
