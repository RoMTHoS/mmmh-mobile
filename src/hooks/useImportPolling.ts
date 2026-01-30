import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useImportStore } from '../stores/importStore';
import { getImportStatus } from '../services/import';
import { logger } from '../utils';

const POLL_INTERVAL = 5000; // 5 seconds

export function useImportPolling() {
  const jobs = useImportStore((state) => state.jobs);
  const updateJob = useImportStore((state) => state.updateJob);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Use a stable reference to poll - gets jobs from store directly to avoid dependency issues
  const pollActiveJobs = useCallback(async () => {
    // Get jobs from store directly to avoid stale closure
    const currentJobs = useImportStore.getState().jobs;
    const activeJobs = currentJobs.filter(
      (j) => j.status === 'pending' || j.status === 'processing'
    );

    if (activeJobs.length === 0) {
      return;
    }

    for (const job of activeJobs) {
      try {
        const status = await getImportStatus(job.jobId);

        updateJob(job.jobId, {
          status: status.status,
          progress: status.progress?.percentage || 0,
          currentStep: status.progress?.currentStep,
          estimatedTimeRemaining: status.estimatedTimeRemaining,
          error: status.error,
          result: status.result,
        });
      } catch (error) {
        logger.error('Failed to poll job status', {
          jobId: job.jobId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }, [updateJob]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      return;
    }

    // Get jobs from store directly
    const currentJobs = useImportStore.getState().jobs;
    const activeJobs = currentJobs.filter(
      (j) => j.status === 'pending' || j.status === 'processing'
    );

    if (activeJobs.length > 0) {
      pollActiveJobs();
      intervalRef.current = setInterval(pollActiveJobs, POLL_INTERVAL);
    }
  }, [pollActiveJobs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle app state changes - pause polling when app is backgrounded
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - resume polling
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - stop polling
        stopPolling();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [startPolling, stopPolling]);

  // Start/stop polling based on active jobs
  useEffect(() => {
    const activeJobs = jobs.filter((j) => j.status === 'pending' || j.status === 'processing');

    if (activeJobs.length > 0 && !intervalRef.current) {
      startPolling();
    } else if (activeJobs.length === 0 && intervalRef.current) {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [jobs, startPolling, stopPolling]);

  return {
    isPolling: intervalRef.current !== null,
    pollNow: pollActiveJobs,
  };
}
