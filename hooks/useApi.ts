"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useApi<T>(fn: () => Promise<T>): UseApiResult<T> {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const run = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fnRef.current()
      .then((result) => {
        setData(result);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return { data, error, isLoading, refetch: run };
}
