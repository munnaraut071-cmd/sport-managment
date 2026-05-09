import { useState, useEffect, useCallback, useRef } from 'react';
import { AxiosError, AxiosResponse } from 'axios';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
  retries?: number;
  retryDelay?: number;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Generic hook for API queries (GET requests)
export function useApiQuery<T>(
  fetchFn: () => Promise<AxiosResponse<any>>,
  options: UseApiOptions<T> = {}
): UseApiState<T> {
  const { onSuccess, onError, enabled = true, retries = 3, retryDelay = 1000 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const retryCount = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn();
      
      // Handle different response structures
      const resultData = response.data?.data ?? response.data;
      setData(resultData as T);
      retryCount.current = 0;
      onSuccess?.(resultData as T);
    } catch (err) {
      const axiosError = err as AxiosError;
      
      // Don't set error if request was aborted
      if (axiosError.name === 'AbortError' || axiosError.message?.includes('aborted')) {
        return;
      }
      
      const errorData = axiosError.response?.data as { message?: string };
      const errorMessage = errorData?.message || 
                          axiosError.message || 
                          'An error occurred while fetching data';
      
      setError(errorMessage);
      onError?.(errorMessage);
      
      // Retry logic for network errors
      if (retryCount.current < retries && !axiosError.response) {
        retryCount.current++;
        setTimeout(() => {
          fetchData();
        }, retryDelay * retryCount.current);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled, retries, retryDelay, onSuccess, onError]);

  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for API mutations (POST, PUT, DELETE)
export function useApiMutation<T, D = any>(
  mutationFn: (data: D) => Promise<AxiosResponse<any>>,
  options: UseApiOptions<T> = {}
) {
  const { onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const mutate = useCallback(async (variables: D): Promise<T | null> => {
    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await mutationFn(variables);
      const resultData = response.data?.data ?? response.data;
      setData(resultData as T);
      onSuccess?.(resultData as T);
      return resultData as T;
    } catch (err) {
      const axiosError = err as AxiosError;
      
      if (axiosError.name === 'AbortError') {
        return null;
      }
      
      const errorData = axiosError.response?.data as { message?: string };
      const errorMessage = errorData?.message || 
                          axiosError.message || 
                          'An error occurred';
      
      setError(errorMessage);
      onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { mutate, data, loading, error, reset };
}

// Hook for paginated data
export function usePaginatedQuery<T>(
  fetchFn: (page: number, limit: number) => Promise<AxiosResponse<any>>,
  options: UseApiOptions<T[]> & { pageSize?: number } = {}
) {
  const { pageSize = 10, onSuccess, onError, enabled = true } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async (currentPage: number, append: boolean = false) => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn(currentPage, pageSize);
      const resultData = response.data?.data ?? response.data ?? [];
      const pagination = response.data?.pagination;
      
      if (append) {
        setData(prev => [...prev, ...(resultData as T[])]);
      } else {
        setData(resultData as T[]);
      }
      
      if (pagination) {
        setTotal(pagination.total);
        setHasMore(currentPage < pagination.pages);
      } else {
        setHasMore(resultData.length === pageSize);
      }
      
      onSuccess?.(resultData as T[]);
    } catch (err) {
      const axiosError = err as AxiosError;
      const errorData = axiosError.response?.data as { message?: string };
      const errorMessage = errorData?.message || axiosError.message || 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, pageSize, enabled, onSuccess, onError]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, true);
    }
  }, [loading, hasMore, page, fetchData]);

  const refresh = useCallback(() => {
    setPage(1);
    setData([]);
    fetchData(1, false);
  }, [fetchData]);

  useEffect(() => {
    fetchData(1, false);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    hasMore,
    total,
    page,
    loadMore,
    refresh,
  };
}

// Hook for optimistic updates
export function useOptimisticMutation<T, D = any>(
  mutationFn: (data: D) => Promise<AxiosResponse<any>>,
  options: UseApiOptions<T> & {
    onMutate?: (variables: D) => void;
    onRollback?: () => void;
  } = {}
) {
  const { onSuccess, onError, onMutate, onRollback } = options;
  const [loading, setLoading] = useState(false);
  const previousData = useRef<T | null>(null);

  const mutate = useCallback(async (variables: D): Promise<T | null> => {
    setLoading(true);
    
    // Call onMutate for optimistic update
    onMutate?.(variables);

    try {
      const response = await mutationFn(variables);
      const resultData = response.data?.data ?? response.data;
      onSuccess?.(resultData as T);
      return resultData as T;
    } catch (err) {
      const axiosError = err as AxiosError;
      const errorData = axiosError.response?.data as { message?: string };
      const errorMessage = errorData?.message || axiosError.message || 'An error occurred';
      
      // Rollback on error
      onRollback?.();
      onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError, onMutate, onRollback]);

  return { mutate, loading };
}

// Hook for auto-refreshing data
export function useAutoRefresh<T>(
  fetchFn: () => Promise<AxiosResponse<any>>,
  interval: number = 30000, // 30 seconds
  options: UseApiOptions<T> = {}
) {
  const { onSuccess, onError, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn();
      const resultData = response.data?.data ?? response.data;
      setData(resultData as T);
      onSuccess?.(resultData as T);
    } catch (err) {
      const axiosError = err as AxiosError;
      const errorData = axiosError.response?.data as { message?: string };
      const errorMessage = errorData?.message || axiosError.message || 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled, onSuccess, onError]);

  useEffect(() => {
    fetchData();
    
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(fetchData, interval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, interval, enabled]);

  return { data, loading, error, refetch: fetchData };
}

// Debounced search hook
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<AxiosResponse<any>>,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchFn(searchQuery);
      const resultData = response.data?.data ?? response.data ?? [];
      setData(resultData as T[]);
    } catch (err) {
      const axiosError = err as AxiosError;
      const errorData = axiosError.response?.data as { message?: string };
      const errorMessage = errorData?.message || axiosError.message || 'Search failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [searchFn]);

  const setSearchQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      search(newQuery);
    }, debounceMs);
  }, [search, debounceMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { query, setQuery: setSearchQuery, data, loading, error };
}

export default useApiQuery;
