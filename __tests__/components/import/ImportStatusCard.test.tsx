import React from 'react';
import { render } from '@testing-library/react-native';
import { ImportStatusCard } from '../../../src/components/import/ImportStatusCard';
import type { ImportJob, ImportStatus } from '../../../src/stores/importStore';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

describe('ImportStatusCard', () => {
  describe('module exports', () => {
    it('exports ImportStatusCard component', () => {
      expect(ImportStatusCard).toBeDefined();
      expect(typeof ImportStatusCard).toBe('function');
    });
  });

  describe('job status types', () => {
    const statuses: ImportStatus[] = ['pending', 'processing', 'completed', 'failed'];

    it('defines valid status types', () => {
      expect(statuses).toContain('pending');
      expect(statuses).toContain('processing');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('failed');
    });
  });

  describe('job structure', () => {
    it('job has required fields', () => {
      const mockJob: ImportJob = {
        jobId: 'job-123',
        importType: 'video',
        sourceUrl: 'https://www.instagram.com/reel/ABC123',
        platform: 'instagram',
        status: 'processing',
        progress: 50,
        currentStep: 'transcribing',
        createdAt: new Date().toISOString(),
      };

      expect(mockJob.jobId).toBeDefined();
      expect(mockJob.importType).toBe('video');
      expect(mockJob.status).toBe('processing');
      expect(mockJob.progress).toBe(50);
    });

    it('job can have error for failed status', () => {
      const mockJob: ImportJob = {
        jobId: 'job-123',
        importType: 'video',
        sourceUrl: 'https://www.instagram.com/reel/ABC123',
        status: 'failed',
        progress: 0,
        createdAt: new Date().toISOString(),
        error: {
          code: 'TIMEOUT',
          message: 'Request timed out',
          retryable: true,
        },
      };

      expect(mockJob.error).toBeDefined();
      expect(mockJob.error?.code).toBe('TIMEOUT');
      expect(mockJob.error?.retryable).toBe(true);
    });

    it('job can have result for completed status', () => {
      const mockJob: ImportJob = {
        jobId: 'job-123',
        importType: 'video',
        sourceUrl: 'https://www.instagram.com/reel/ABC123',
        status: 'completed',
        progress: 100,
        createdAt: new Date().toISOString(),
        result: { recipeId: 'recipe-456' },
      };

      expect(mockJob.result).toBeDefined();
    });

    it('job can have pipeline metadata for completed status', () => {
      const mockJob: ImportJob = {
        jobId: 'job-123',
        importType: 'video',
        sourceUrl: 'https://www.instagram.com/reel/ABC123',
        status: 'completed',
        progress: 100,
        createdAt: new Date().toISOString(),
        pipeline: 'gemini',
        fallbackUsed: false,
      };

      expect(mockJob.pipeline).toBe('gemini');
      expect(mockJob.fallbackUsed).toBe(false);
    });

    it('job can have fallback metadata', () => {
      const mockJob: ImportJob = {
        jobId: 'job-123',
        importType: 'photo',
        sourceUrl: 'photo://test.jpg',
        status: 'completed',
        progress: 100,
        createdAt: new Date().toISOString(),
        pipeline: 'vps',
        fallbackUsed: true,
      };

      expect(mockJob.pipeline).toBe('vps');
      expect(mockJob.fallbackUsed).toBe(true);
    });
  });

  describe('pipeline badge rendering', () => {
    const noop = () => {};
    const baseJob: ImportJob = {
      jobId: 'test-1',
      importType: 'video',
      sourceUrl: 'https://instagram.com/reel/ABC',
      platform: 'instagram',
      status: 'completed',
      progress: 100,
      createdAt: new Date().toISOString(),
    };

    it('renders Standard badge for VPS pipeline', () => {
      const job: ImportJob = { ...baseJob, pipeline: 'vps' };
      const { getByText } = render(
        React.createElement(ImportStatusCard, { job, onDismiss: noop, onRetry: noop })
      );

      expect(getByText('Standard')).toBeDefined();
    });

    it('renders Premium badge for Gemini pipeline', () => {
      const job: ImportJob = { ...baseJob, pipeline: 'gemini' };
      const { getByText } = render(
        React.createElement(ImportStatusCard, { job, onDismiss: noop, onRetry: noop })
      );

      expect(getByText(/Premium/)).toBeDefined();
    });

    it('defaults to Standard badge when pipeline is not set', () => {
      const job: ImportJob = { ...baseJob, pipeline: undefined };
      const { getByText } = render(
        React.createElement(ImportStatusCard, { job, onDismiss: noop, onRetry: noop })
      );

      expect(getByText('Standard')).toBeDefined();
    });
  });

  describe('fallback notification', () => {
    const noop = () => {};
    const baseJob: ImportJob = {
      jobId: 'test-2',
      importType: 'video',
      sourceUrl: 'https://instagram.com/reel/DEF',
      platform: 'instagram',
      status: 'completed',
      progress: 100,
      createdAt: new Date().toISOString(),
    };

    it('shows fallback notice when completed with fallback', () => {
      const job: ImportJob = { ...baseJob, pipeline: 'vps', fallbackUsed: true };
      const { getByText } = render(
        React.createElement(ImportStatusCard, { job, onDismiss: noop, onRetry: noop })
      );

      expect(getByText(/pipeline standard/)).toBeDefined();
    });

    it('does not show fallback notice when no fallback occurred', () => {
      const job: ImportJob = { ...baseJob, pipeline: 'gemini', fallbackUsed: false };
      const { queryByText } = render(
        React.createElement(ImportStatusCard, { job, onDismiss: noop, onRetry: noop })
      );

      expect(queryByText(/pipeline standard/)).toBeNull();
    });
  });
});
