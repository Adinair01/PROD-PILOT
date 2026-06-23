import { useState, useEffect, useCallback } from "react";
import { api } from "../api/axios";

/**
 * Loads and submits org-scoped feedback. Centralizes the fetch/submit/error
 * logic that every role dashboard previously duplicated.
 *
 * 401s are handled globally by the axios interceptor (redirect to sign-in), so
 * they are intentionally not surfaced as page-level errors here.
 */
export function useFeedback({ autoFetch = true } = {}) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const refetch = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await api.get("/feedback");
      setFeedback(res.data.items ?? []);
    } catch (err) {
      if (err.response?.status !== 401) {
        setError("Couldn't load feedback. Please try again.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) refetch();
  }, [autoFetch, refetch]);

  // Throws on failure so callers can show an error and avoid false "success".
  // Refreshes the list only when this hook owns one.
  const submitFeedback = useCallback(
    async (message) => {
      await api.post("/feedback", { message });
      if (autoFetch) await refetch({ silent: true });
    },
    [autoFetch, refetch]
  );

  return { feedback, loading, error, refetch, submitFeedback };
}
