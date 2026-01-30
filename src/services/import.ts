/**
 * Import service for recipe extraction API calls
 */

// API base URL - should come from environment config
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface SubmitImportRequest {
  importType: 'video' | 'website';
  sourceUrl: string;
  html?: string;
}

export interface ImportJobResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  platform?: string;
  createdAt: string;
}

export interface ImportProgress {
  percentage: number;
  currentStep: string;
}

export interface ImportError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface ImportStatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: ImportProgress;
  estimatedTimeRemaining?: number;
  error?: ImportError;
  result?: unknown;
}

class ImportServiceError extends Error {
  code: string;
  retryable: boolean;

  constructor(code: string, message: string, retryable = false) {
    super(message);
    this.name = 'ImportServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

export async function submitImport(request: SubmitImportRequest): Promise<ImportJobResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ImportServiceError(
        errorData.code || 'SUBMIT_FAILED',
        errorData.message || `Request failed with status ${response.status}`,
        response.status >= 500
      );
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    if (error instanceof ImportServiceError) {
      throw error;
    }

    throw new ImportServiceError(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed',
      true
    );
  }
}

export async function getImportStatus(jobId: string): Promise<ImportStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/import/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ImportServiceError(
        errorData.code || 'STATUS_FAILED',
        errorData.message || `Request failed with status ${response.status}`,
        response.status >= 500
      );
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    if (error instanceof ImportServiceError) {
      throw error;
    }

    throw new ImportServiceError(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed',
      true
    );
  }
}

export async function cancelImport(jobId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/import/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok && response.status !== 404) {
      const errorData = await response.json().catch(() => ({}));
      throw new ImportServiceError(
        errorData.code || 'CANCEL_FAILED',
        errorData.message || `Request failed with status ${response.status}`,
        false
      );
    }
  } catch (error) {
    if (error instanceof ImportServiceError) {
      throw error;
    }

    throw new ImportServiceError(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed',
      true
    );
  }
}

export { ImportServiceError };
