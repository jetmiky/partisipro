/**
 * API Hooks
 * React hooks for API service integration
 */

import { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../services';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for API calls
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for API mutations (POST, PUT, DELETE)
 */
export function useApiMutation<T, P = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (
      apiCall: (params: P) => Promise<T>,
      params: P
    ): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall(params);
        return result;
      } catch (err) {
        setError(getErrorMessage(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    mutate,
    loading,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for paginated API calls
 */
export function usePaginatedApi<T>(
  apiCall: (params: { page: number; limit: number }) => Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>,
  initialLimit: number = 10
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(
    async (newPage = page, newLimit = limit) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall({ page: newPage, limit: newLimit });

        if (newPage === 1) {
          setData(result.data);
        } else {
          setData(prev => [...prev, ...result.data]);
        }

        setTotal(result.total);
        setTotalPages(result.totalPages);
        setPage(newPage);
        setLimit(newLimit);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [apiCall, page, limit]
  );

  useEffect(() => {
    fetchData(1, limit);
  }, []);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      fetchData(page + 1, limit);
    }
  }, [page, totalPages, loading, fetchData, limit]);

  const refresh = useCallback(() => {
    fetchData(1, limit);
  }, [fetchData, limit]);

  const changeLimit = useCallback(
    (newLimit: number) => {
      setData([]);
      fetchData(1, newLimit);
    },
    [fetchData]
  );

  return {
    data,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
    loadMore,
    refresh,
    changeLimit,
  };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<T>(initialData: T[]) {
  const [data, setData] = useState<T[]>(initialData);

  const optimisticAdd = useCallback((item: T) => {
    setData(prev => [...prev, item]);

    return {
      revert: () => setData(prev => prev.slice(0, -1)),
    };
  }, []);

  const optimisticUpdate = useCallback(
    (id: string | number, updates: Partial<T>) => {
      const originalData = [...data];

      setData(prev =>
        prev.map(item =>
          (item as any).id === id ? { ...item, ...updates } : item
        )
      );

      return {
        revert: () => setData(originalData),
      };
    },
    [data]
  );

  const optimisticRemove = useCallback(
    (id: string | number) => {
      const originalData = [...data];

      setData(prev => prev.filter(item => (item as any).id !== id));

      return {
        revert: () => setData(originalData),
      };
    },
    [data]
  );

  return {
    data,
    setData,
    optimisticAdd,
    optimisticUpdate,
    optimisticRemove,
  };
}

/**
 * Hook for debounced API search
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const searchResults = await searchFn(query);
        setResults(searchResults);
      } catch (err) {
        setError(getErrorMessage(err));
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [query, searchFn, delay]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
  };
}

/**
 * Hook for real-time data with polling
 */
export function usePolling<T>(
  apiCall: () => Promise<T>,
  interval: number = 30000, // 30 seconds
  dependencies: any[] = []
) {
  const { data, loading, error, refetch } = useApi(apiCall, dependencies);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!isPolling) return;

    const intervalId = setInterval(() => {
      if (!loading) {
        refetch();
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [isPolling, loading, refetch, interval]);

  return {
    data,
    loading,
    error,
    refetch,
    isPolling,
    startPolling: () => setIsPolling(true),
    stopPolling: () => setIsPolling(false),
  };
}
