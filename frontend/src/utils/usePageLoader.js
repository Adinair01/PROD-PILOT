import { useState, useEffect, useRef } from "react";

/**
 * usePageLoader — shows a loader for at least `minMs` milliseconds.
 * Even if data loads instantly, the loader stays visible until the minimum time elapses.
 *
 * @param {boolean} dataReady  — true when your async data has finished loading
 * @param {number}  minMs      — minimum display time in ms (default 3500)
 * @returns {boolean}          — true while the loader should be shown
 */
export function usePageLoader(dataReady, minMs = 3500) {
  const [showLoader, setShowLoader] = useState(true);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!dataReady) return;
    const elapsed = Date.now() - startRef.current;
    const remaining = Math.max(0, minMs - elapsed);
    const t = setTimeout(() => setShowLoader(false), remaining);
    return () => clearTimeout(t);
  }, [dataReady, minMs]);

  return showLoader;
}
