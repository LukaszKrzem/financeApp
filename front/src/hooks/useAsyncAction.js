import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async (fn) => {
    setError('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      const errorMessage = err.message || 'Something went wrong';
      setError(errorMessage);
      toast.error('Action failed', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setError, run };
}
