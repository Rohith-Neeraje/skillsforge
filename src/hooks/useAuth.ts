import { useEffect, useState } from 'react';
import { signInAnonymously } from '../services/progress';

interface UseAuthResult {
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthResult {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const id = await signInAnonymously();
        if (!cancelled) {
          setUserId(id);
          if (!id) {
            setError('Could not sign in. Playing without persistence.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Auth error. Playing without persistence.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return { userId, isLoading, error };
}