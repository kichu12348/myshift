import { useEffect, useRef, useState } from 'react';
import { initializeStores } from '@/store';

export type StoreInitializationResult =
  | { readonly status: 'loading' }
  | { readonly status: 'ready' }
  | { readonly status: 'error'; readonly message: string };

/**
 * Executes startup store initialization once upon mounting.
 * Guards against double-execution in React StrictMode and remounts.
 */
export function useStoreInitialization(): StoreInitializationResult {
  const [result, setResult] = useState<StoreInitializationResult>({ status: 'loading' });
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    let isMounted = true;

    void (async (): Promise<void> => {
      try {
        await initializeStores();
        if (isMounted) {
          setResult({ status: 'ready' });
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to initialize app stores';
          setResult({ status: 'error', message });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return result;
}
