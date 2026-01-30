import { useImportStore, ImportJob } from '../../src/stores/importStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('importStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useImportStore.setState({ jobs: [] });
  });

  const createMockJob = (overrides: Partial<ImportJob> = {}): ImportJob => ({
    jobId: `job-${Math.random().toString(36).substr(2, 9)}`,
    importType: 'video',
    sourceUrl: 'https://www.instagram.com/reel/ABC123',
    platform: 'instagram',
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  describe('addJob', () => {
    it('adds a job to the store', () => {
      const job = createMockJob();
      useImportStore.getState().addJob(job);

      expect(useImportStore.getState().jobs).toHaveLength(1);
      expect(useImportStore.getState().jobs[0]).toEqual(job);
    });

    it('respects max 3 jobs limit', () => {
      const job1 = createMockJob({ jobId: 'job-1' });
      const job2 = createMockJob({ jobId: 'job-2' });
      const job3 = createMockJob({ jobId: 'job-3' });
      const job4 = createMockJob({ jobId: 'job-4' });

      useImportStore.getState().addJob(job1);
      useImportStore.getState().addJob(job2);
      useImportStore.getState().addJob(job3);
      useImportStore.getState().addJob(job4);

      // Should still have 3 jobs since all are pending (active)
      expect(useImportStore.getState().jobs).toHaveLength(3);
    });

    it('removes completed job when at max capacity', () => {
      const job1 = createMockJob({ jobId: 'job-1', status: 'completed' });
      const job2 = createMockJob({ jobId: 'job-2' });
      const job3 = createMockJob({ jobId: 'job-3' });
      const job4 = createMockJob({ jobId: 'job-4' });

      useImportStore.getState().addJob(job1);
      useImportStore.getState().addJob(job2);
      useImportStore.getState().addJob(job3);
      useImportStore.getState().addJob(job4);

      expect(useImportStore.getState().jobs).toHaveLength(3);
      expect(useImportStore.getState().jobs.find((j) => j.jobId === 'job-1')).toBeUndefined();
      expect(useImportStore.getState().jobs.find((j) => j.jobId === 'job-4')).toBeDefined();
    });
  });

  describe('updateJob', () => {
    it('updates job status', () => {
      const job = createMockJob({ jobId: 'job-1' });
      useImportStore.getState().addJob(job);

      useImportStore.getState().updateJob('job-1', { status: 'processing', progress: 50 });

      const updatedJob = useImportStore.getState().jobs[0];
      expect(updatedJob.status).toBe('processing');
      expect(updatedJob.progress).toBe(50);
    });

    it('updates job error', () => {
      const job = createMockJob({ jobId: 'job-1' });
      useImportStore.getState().addJob(job);

      useImportStore.getState().updateJob('job-1', {
        status: 'failed',
        error: { code: 'TIMEOUT', message: 'Request timed out', retryable: true },
      });

      const updatedJob = useImportStore.getState().jobs[0];
      expect(updatedJob.status).toBe('failed');
      expect(updatedJob.error?.code).toBe('TIMEOUT');
      expect(updatedJob.error?.retryable).toBe(true);
    });

    it('does not affect other jobs', () => {
      const job1 = createMockJob({ jobId: 'job-1' });
      const job2 = createMockJob({ jobId: 'job-2' });
      useImportStore.getState().addJob(job1);
      useImportStore.getState().addJob(job2);

      useImportStore.getState().updateJob('job-1', { progress: 100 });

      expect(useImportStore.getState().jobs.find((j) => j.jobId === 'job-2')?.progress).toBe(0);
    });
  });

  describe('removeJob', () => {
    it('removes job from store', () => {
      const job = createMockJob({ jobId: 'job-1' });
      useImportStore.getState().addJob(job);
      expect(useImportStore.getState().jobs).toHaveLength(1);

      useImportStore.getState().removeJob('job-1');
      expect(useImportStore.getState().jobs).toHaveLength(0);
    });

    it('does not fail on non-existent job', () => {
      useImportStore.getState().removeJob('non-existent');
      expect(useImportStore.getState().jobs).toHaveLength(0);
    });
  });

  describe('getJob', () => {
    it('returns job by ID', () => {
      const job = createMockJob({ jobId: 'job-1' });
      useImportStore.getState().addJob(job);

      const foundJob = useImportStore.getState().getJob('job-1');
      expect(foundJob).toEqual(job);
    });

    it('returns undefined for non-existent job', () => {
      const foundJob = useImportStore.getState().getJob('non-existent');
      expect(foundJob).toBeUndefined();
    });
  });

  describe('getActiveJobs', () => {
    it('returns only pending and processing jobs', () => {
      useImportStore.getState().addJob(createMockJob({ jobId: 'job-1', status: 'pending' }));
      useImportStore.getState().addJob(createMockJob({ jobId: 'job-2', status: 'processing' }));
      useImportStore.getState().addJob(createMockJob({ jobId: 'job-3', status: 'completed' }));

      const activeJobs = useImportStore.getState().getActiveJobs();
      expect(activeJobs).toHaveLength(2);
      expect(activeJobs.map((j) => j.status)).toEqual(['pending', 'processing']);
    });
  });

  describe('clearCompletedJobs', () => {
    it('removes completed and failed jobs', () => {
      useImportStore.getState().addJob(createMockJob({ jobId: 'job-1', status: 'completed' }));
      useImportStore.getState().addJob(createMockJob({ jobId: 'job-2', status: 'failed' }));
      useImportStore.getState().addJob(createMockJob({ jobId: 'job-3', status: 'processing' }));

      useImportStore.getState().clearCompletedJobs();

      expect(useImportStore.getState().jobs).toHaveLength(1);
      expect(useImportStore.getState().jobs[0].jobId).toBe('job-3');
    });
  });
});
