import { useEffect, useRef, useCallback, useState } from 'react';
import { auditApi } from '../services/api';

/**
 * usePolling — Runs a callback on a fixed interval.
 * Automatically pauses when the browser tab is hidden and resumes on focus.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  options: {
    immediate?: boolean;
    pauseOnHidden?: boolean;
    stopWhen?: boolean;
  } = {}
) {
  const { immediate = true, pauseOnHidden = true, stopWhen = false } = options;
  const savedCallback = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const tick = useCallback(async () => {
    await savedCallback.current();
    setLastUpdated(new Date());
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPolling(true);
    timerRef.current = setInterval(tick, intervalMs);
  }, [tick, intervalMs]);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsPolling(false);
  }, []);

  const triggerNow = useCallback(() => {
    tick();
  }, [tick]);

  useEffect(() => {
    if (stopWhen) { stop(); return; }
    if (immediate) tick();
    start();
    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopWhen, immediate]);

  useEffect(() => {
    if (!pauseOnHidden) return;
    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        if (!stopWhen) { tick(); start(); }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseOnHidden, stopWhen]);

  return { isPolling, lastUpdated, triggerNow };
}

/**
 * useAuditStatusPoller — Polls a single audit status until it reaches a terminal state.
 * Calls onComplete when done.
 */
export function useAuditStatusPoller(
  auditId: string | undefined,
  isActive: boolean,
  onComplete: () => void,
  intervalMs = 3000
) {
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'polling' | 'done'>('idle');

  useEffect(() => {
    if (!auditId || !isActive) return;

    setPollingStatus('polling');

    pollingRef.current = setInterval(async () => {
      try {
        const status = await auditApi.getAuditStatus(auditId);
        if (
          status.status === 'completed' ||
          status.status === 'partially_completed' ||
          status.status === 'failed'
        ) {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus('done');
          onComplete();
        }
      } catch {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setPollingStatus('done');
      }
    }, intervalMs);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditId, isActive, intervalMs]);

  return pollingStatus;
}
