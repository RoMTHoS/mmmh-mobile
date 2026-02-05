import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Platform } from '../utils/validation';

export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImportJobError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface ImportJob {
  jobId: string;
  importType: 'video' | 'website' | 'photo';
  sourceUrl: string;
  platform?: Platform | string;
  status: ImportStatus;
  progress: number;
  currentStep?: string;
  estimatedTimeRemaining?: number;
  error?: ImportJobError;
  result?: unknown;
  createdAt: string;
}

interface ImportStore {
  jobs: ImportJob[];
  addJob: (job: ImportJob) => void;
  updateJob: (jobId: string, updates: Partial<ImportJob>) => void;
  removeJob: (jobId: string) => void;
  getJob: (jobId: string) => ImportJob | undefined;
  getActiveJobs: () => ImportJob[];
  clearCompletedJobs: () => void;
}

const MAX_JOBS = 3;

export const useImportStore = create<ImportStore>()(
  persist(
    (set, get) => ({
      jobs: [],

      addJob: (job) => {
        const jobs = get().jobs;

        // If we're at max capacity, try to remove oldest completed/failed job
        if (jobs.length >= MAX_JOBS) {
          const completedOrFailed = jobs.find(
            (j) => j.status === 'completed' || j.status === 'failed'
          );

          if (completedOrFailed) {
            set({
              jobs: [...jobs.filter((j) => j.jobId !== completedOrFailed.jobId), job],
            });
            return;
          }

          // Cannot add more jobs if all are active
          return;
        }

        set({ jobs: [...jobs, job] });
      },

      updateJob: (jobId, updates) => {
        set({
          jobs: get().jobs.map((job) => (job.jobId === jobId ? { ...job, ...updates } : job)),
        });
      },

      removeJob: (jobId) => {
        set({ jobs: get().jobs.filter((job) => job.jobId !== jobId) });
      },

      getJob: (jobId) => {
        return get().jobs.find((job) => job.jobId === jobId);
      },

      getActiveJobs: () => {
        return get().jobs.filter((j) => j.status === 'pending' || j.status === 'processing');
      },

      clearCompletedJobs: () => {
        set({
          jobs: get().jobs.filter((j) => j.status !== 'completed' && j.status !== 'failed'),
        });
      },
    }),
    {
      name: 'import-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
