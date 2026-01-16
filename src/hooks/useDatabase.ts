import { useEffect, useState } from 'react';
import { initializeDatabase } from '../services/database';

interface UseDatabaseResult {
  isReady: boolean;
  error: Error | null;
}

export function useDatabase(): UseDatabaseResult {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initializeDatabase();
        if (mounted) {
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Database initialization failed'));
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
}
