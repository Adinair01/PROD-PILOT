import { useState, useEffect, useRef } from "react";

/**
 * usePageLoader — keeps a loader visible for at least `minMs` to avoid a jarring
 * flash, but no longer. Once data is ready and the minimum has elapsed, it hides.
 *
 * @param {boolean} dataReady — true when async data has finished loading
 * @param {number}  minMs     — minimum display time in ms
 * @returns {boolean}         — true while the loader should be shown
 */
export function usePageLoader(dataReady, minMs = 600) {
  const [showLoader, setShowLoader] = useState(true);
  const startRef = useRef(0);

  // Stamp the mount time inside an effect (Date.now() is impure — not allowed
  // during render).
  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!dataReady) return undefined;
    const elapsed = Date.now() - startRef.current;
    const remaining = Math.max(0, minMs - elapsed);
    const t = setTimeout(() => setShowLoader(false), remaining);
    return () => clearTimeout(t);
  }, [dataReady, minMs]);

  return showLoader;
}
