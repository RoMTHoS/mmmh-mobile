import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { PostImportPrompt } from '../../../src/components/import/PostImportPrompt';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));

// Mock submitImport
jest.mock('../../../src/services/import', () => ({
  submitImport: jest.fn(),
}));

// Mock importStore
jest.mock('../../../src/stores/importStore', () => ({
  useImportStore: {
    getState: () => ({ addJob: jest.fn() }),
  },
}));

// Mock Toast
jest.mock('../../../src/utils/toast', () => ({
  Toast: { show: jest.fn() },
}));

describe('PostImportPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('after free import with VPS pipeline', () => {
    it('shows upgrade CTA when user can activate trial', () => {
      const { getByTestId, getByText } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'vps',
          tier: 'free',
          canActivateTrial: true,
          geminiQuotaRemaining: 0,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      expect(getByTestId('post-import-prompt-cta')).toBeDefined();
      expect(getByText('Envie de meilleurs resultats ?')).toBeDefined();
      expect(getByTestId('post-import-upgrade')).toBeDefined();
      expect(getByText('Passer premium')).toBeDefined();
    });

    it('shows premium import button when gemini quota remaining', () => {
      const { getByTestId, getByText } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'vps',
          tier: 'free',
          canActivateTrial: false,
          geminiQuotaRemaining: 3,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      expect(getByTestId('post-import-prompt-cta')).toBeDefined();
      expect(getByTestId('post-import-premium-import')).toBeDefined();
      expect(getByText('Import premium')).toBeDefined();
    });

    it('shows both buttons when quota remaining and can activate trial', () => {
      const { getByTestId } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'vps',
          tier: 'free',
          canActivateTrial: true,
          geminiQuotaRemaining: 2,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      expect(getByTestId('post-import-prompt-cta')).toBeDefined();
      expect(getByTestId('post-import-premium-import')).toBeDefined();
      expect(getByTestId('post-import-upgrade')).toBeDefined();
    });

    it('shows nothing when no quota and cannot activate trial', () => {
      const { queryByTestId } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'vps',
          tier: 'free',
          canActivateTrial: false,
          geminiQuotaRemaining: 0,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      expect(queryByTestId('post-import-prompt-cta')).toBeNull();
    });

    it('navigates to upgrade on "Passer premium" press', () => {
      const { router } = jest.requireMock('expo-router');
      const { getByTestId } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'vps',
          tier: 'free',
          canActivateTrial: true,
          geminiQuotaRemaining: 0,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      fireEvent.press(getByTestId('post-import-upgrade'));
      expect(router.push).toHaveBeenCalledWith('/upgrade');
    });

    it('shows confirmation alert on premium import press', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByTestId } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'vps',
          tier: 'free',
          canActivateTrial: false,
          geminiQuotaRemaining: 3,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      fireEvent.press(getByTestId('post-import-premium-import'));
      expect(alertSpy).toHaveBeenCalledWith(
        'Import Premium',
        'Reimporter cette recette avec le pipeline Premium pour de meilleurs resultats ?',
        expect.any(Array)
      );
    });
  });

  describe('after import with Gemini pipeline', () => {
    it('returns null for trial tier', () => {
      const { toJSON } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'gemini',
          tier: 'trial',
          canActivateTrial: false,
          geminiQuotaRemaining: 3,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      expect(toJSON()).toBeNull();
    });

    it('returns null for premium tier', () => {
      const { toJSON } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'gemini',
          tier: 'premium',
          canActivateTrial: false,
          geminiQuotaRemaining: 3,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      expect(toJSON()).toBeNull();
    });
  });

  describe('non-free tiers with VPS pipeline', () => {
    it('returns null for premium tier', () => {
      const { toJSON } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'vps',
          tier: 'premium',
          canActivateTrial: false,
          geminiQuotaRemaining: 3,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      expect(toJSON()).toBeNull();
    });
  });
});
