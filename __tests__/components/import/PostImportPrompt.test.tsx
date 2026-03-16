import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PostImportPrompt } from '../../../src/components/import/PostImportPrompt';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

describe('PostImportPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('after free import with VPS pipeline', () => {
    it('shows trial CTA when user can activate trial', () => {
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
      expect(getByText(/Essayez Premium gratuitement/)).toBeDefined();
      expect(getByText('Essayer')).toBeDefined();
    });

    it('shows nothing when user already used trial', () => {
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
      expect(queryByTestId('post-import-prompt-success')).toBeNull();
    });

    it('navigates to upgrade on "Essayer" press', () => {
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

      fireEvent.press(getByTestId('post-import-try-premium'));
      expect(router.push).toHaveBeenCalledWith('/upgrade');
    });
  });

  describe('after trial import with Gemini pipeline', () => {
    it('shows premium quality success badge', () => {
      const { getByTestId, getByText } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'gemini',
          tier: 'trial',
          canActivateTrial: false,
          geminiQuotaRemaining: 3,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      expect(getByTestId('post-import-prompt-success')).toBeDefined();
      expect(getByText(/qualite Premium/)).toBeDefined();
    });
  });

  describe('after premium import with Gemini pipeline', () => {
    it('shows premium quality success badge', () => {
      const { getByTestId, getByText } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'gemini',
          tier: 'premium',
          canActivateTrial: false,
          geminiQuotaRemaining: 3,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      expect(getByTestId('post-import-prompt-success')).toBeDefined();
      expect(getByText(/qualite Premium/)).toBeDefined();
    });
  });

  describe('dismissal', () => {
    it('hides prompt when dismissed', () => {
      const { getByTestId, queryByTestId } = render(
        React.createElement(PostImportPrompt, {
          pipeline: 'gemini',
          tier: 'trial',
          canActivateTrial: false,
          geminiQuotaRemaining: 3,
          sourceUrl: 'https://example.com',
          importType: 'website' as const,
        })
      );

      expect(getByTestId('post-import-prompt-success')).toBeDefined();
      fireEvent.press(getByTestId('post-import-dismiss'));
      expect(queryByTestId('post-import-prompt-success')).toBeNull();
    });

    it('hides CTA prompt when dismissed', () => {
      const { getByTestId, queryByTestId } = render(
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
      fireEvent.press(getByTestId('post-import-dismiss'));
      expect(queryByTestId('post-import-prompt-cta')).toBeNull();
    });
  });
});
