// ============================================
//  useDriveFiles — Auto-refreshing Drive hook
// ============================================

"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface UseDriveFilesOptions<T> {
  /** Fetch function to call */
  fetchFn: () => Promise<T[]>;
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  interval?: number;
  /** Whether to enable auto-refresh (default: true) */
  autoRefresh?: boolean;
}

interface UseDriveFilesResult<T> {
  /** The fetched files */
  files: T[];
  /** Whether the initial load is happening */
  loading: boolean;
  /** Any error message */
  error: string | null;
  /** Whether a background refresh is happening */
  refreshing: boolean;
  /** Manually trigger a refresh */
  refresh: () => void;
  /** Last refresh timestamp */
  lastRefreshed: Date | null;
}

export function useDriveFiles<T>({
  fetchFn,
  interval = 30000,
  autoRefresh = true,
}: UseDriveFilesOptions<T>): UseDriveFilesResult<T> {
  const [files, setFiles] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const isFirstLoad = useRef(true);

  const doFetch = useCallback(async () => {
    const isFirst = isFirstLoad.current;

    if (isFirst) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const result = await fetchFn();
      setFiles(result);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(String(err));
    } finally {
      if (isFirst) {
        setLoading(false);
        isFirstLoad.current = false;
      }
      setRefreshing(false);
    }
  }, [fetchFn]);

  // Initial fetch
  useEffect(() => {
    doFetch();
  }, [doFetch]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh || interval <= 0) return;

    const timer = setInterval(doFetch, interval);
    return () => clearInterval(timer);
  }, [doFetch, autoRefresh, interval]);

  return {
    files,
    loading,
    error,
    refreshing,
    refresh: doFetch,
    lastRefreshed,
  };
}
