import { useState, useEffect, useCallback } from "react";
import { api } from "../api/axios";

/**
 * Loads aggregated PM insights, with optional background polling so KPIs stay
 * fresh as teams submit feedback.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.pollMs] — if set, silently refetches on this interval.
 */
export function useInsights({ pollMs } = {}) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await api.get("/pm-insights");
      setInsights(res.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        setError("Couldn't load insights. Please try again.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!pollMs) return undefined;
    const id = setInterval(() => refetch({ silent: true }), pollMs);
    return () => clearInterval(id);
  }, [pollMs, refetch]);

  return { insights, loading, error, refetch };
}
