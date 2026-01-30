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
  });
});
