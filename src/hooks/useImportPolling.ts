import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useImportStore } from '../stores/importStore';
import { getImportStatus } from '../services/import';
import { logger } from '../utils';

const POLL_INTERVAL = 5000; // 5 seconds

export function useImportPolling() {
  const updateJob = useImportStore((state) => state.updateJob);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const prevActiveCountRef = useRef(0);

  // Stable polling function - gets jobs from store directly
  const pollActiveJobs = useCallback(async () => {
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

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      return; // Already polling
    }

    const currentJobs = useImportStore.getState().jobs;
    const activeJobs = currentJobs.filter(
      (j) => j.status === 'pending' || j.status === 'processing'
    );

    if (activeJobs.length > 0) {
      // Poll immediately once, then start interval
      pollActiveJobs();
      intervalRef.current = setInterval(pollActiveJobs, POLL_INTERVAL);
    }
  }, [pollActiveJobs]);

  // Handle app state changes - pause polling when app is backgrounded
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        stopPolling();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [startPolling, stopPolling]);

  // Subscribe to store changes to start/stop polling
  // Only react to transitions: 0 -> N (start) or N -> 0 (stop)
  useEffect(() => {
    const unsubscribe = useImportStore.subscribe((state) => {
      const activeCount = state.jobs.filter(
        (j) => j.status === 'pending' || j.status === 'processing'
      ).length;

      const prevCount = prevActiveCountRef.current;
      prevActiveCountRef.current = activeCount;

      // Only start if we went from 0 to >0 active jobs
      if (activeCount > 0 && prevCount === 0) {
        startPolling();
      }
      // Only stop if we went from >0 to 0 active jobs
      else if (activeCount === 0 && prevCount > 0) {
        stopPolling();
      }
    });

    // Check initial state
    const initialJobs = useImportStore.getState().jobs;
    const initialActiveCount = initialJobs.filter(
      (j) => j.status === 'pending' || j.status === 'processing'
    ).length;
    prevActiveCountRef.current = initialActiveCount;

    if (initialActiveCount > 0) {
      startPolling();
    }

    return () => {
      unsubscribe();
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return {
    isPolling: intervalRef.current !== null,
    pollNow: pollActiveJobs,
  };
}
