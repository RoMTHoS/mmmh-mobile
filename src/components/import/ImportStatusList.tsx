import { View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { ImportStatusCard } from './ImportStatusCard';
import { useImportStore } from '../../stores/importStore';
import { useImportPolling } from '../../hooks/useImportPolling';
import { submitImport } from '../../services/import';
import { spacing } from '../../theme';

export function ImportStatusList() {
  const jobs = useImportStore((state) => state.jobs);
  const removeJob = useImportStore((state) => state.removeJob);
  const updateJob = useImportStore((state) => state.updateJob);

  // Start polling for active jobs
  useImportPolling();

  const handleDismiss = (jobId: string) => {
    removeJob(jobId);
  };

  const handleRetry = async (jobId: string) => {
    const job = jobs.find((j) => j.jobId === jobId);
    if (!job) return;

    // Reset job status
    updateJob(jobId, {
      status: 'pending',
      progress: 0,
      currentStep: undefined,
      error: undefined,
    });

    try {
      const response = await submitImport({
        importType: job.importType,
        sourceUrl: job.sourceUrl,
      });

      // Update with new job ID from server
      removeJob(jobId);
      useImportStore.getState().addJob({
        ...job,
        jobId: response.jobId,
        status: response.status,
        progress: 0,
        error: undefined,
        createdAt: response.createdAt || new Date().toISOString(),
      });
    } catch (error) {
      updateJob(jobId, {
        status: 'failed',
        error: {
          code: 'RETRY_FAILED',
          message: error instanceof Error ? error.message : 'Echec de la relance',
          retryable: true,
        },
      });

      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de relancer import',
      });
    }
  };

  // Sort by createdAt descending (most recent first)
  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedJobs.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {sortedJobs.map((job) => (
        <ImportStatusCard
          key={job.jobId}
          job={job}
          onDismiss={() => handleDismiss(job.jobId)}
          onRetry={() => handleRetry(job.jobId)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
});
