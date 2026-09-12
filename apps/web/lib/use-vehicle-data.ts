"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CarView, TeslaMateClient } from "@z/api-client";
import { client } from "./client";

type Snapshot<T> = {
  car: CarView | null;
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  fetchedAt: string | null;
};
export function useVehicleData<T>(
  read: (api: TeslaMateClient, id: number, signal: AbortSignal) => Promise<T>,
  interval?: (data: T | null, failures: number) => number,
) {
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    car: null,
    data: null,
    loading: true,
    refreshing: false,
    error: null,
    fetchedAt: null,
  });
  const [cooldown, setCooldown] = useState(false);
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cooldownTimer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;
    let hasLoaded = false;
    let failures = 0;
    let lastData: T | null = null;
    let car: CarView | null = null;
    let nextDue = 0;
    let manualAllowedAt = 0;

    function schedule() {
      clearTimeout(timer);
      if (!disposed && !document.hidden && interval)
        timer = setTimeout(
          () => {
            void run(false);
          },
          Math.max(0, nextDue - Date.now()),
        );
    }
    async function run(manual: boolean) {
      if (disposed || document.hidden || inFlight) return;
      if (!manual && Date.now() < nextDue) {
        schedule();
        return;
      }
      if (manual && Date.now() < manualAllowedAt) return;
      inFlight = true;
      controller = new AbortController();
      const signal = controller.signal;
      clearTimeout(timer);
      manualAllowedAt = Date.now() + 10_000;
      setCooldown(true);
      clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(() => {
        if (!disposed) setCooldown(false);
      }, 10_000);
      setSnapshot((s) => ({ ...s, error: null, refreshing: hasLoaded }));
      try {
        if (!car) car = (await client.cars(signal))[0] ?? null;
        const data = car ? await read(client, car.id, signal) : null;
        if (disposed || signal.aborted) return;
        hasLoaded = true;
        failures = 0;
        lastData = data;
        setSnapshot({
          car,
          data,
          loading: false,
          refreshing: false,
          error: null,
          fetchedAt: new Date().toISOString(),
        });
      } catch (error) {
        if (disposed || signal.aborted) return;
        hasLoaded = true;
        failures++;
        // No upstream body, schema content or credentials in UI/logs.
        const message =
          error instanceof Error && error.name !== "ZodError"
            ? error.message
            : "数据格式与当前版本不匹配，请核对 API";
        setSnapshot((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          error: message,
        }));
      } finally {
        inFlight = false;
        if (!disposed && !signal.aborted) {
          nextDue =
            Date.now() +
            (interval
              ? interval(lastData, failures)
              : Number.POSITIVE_INFINITY);
          schedule();
        }
      }
    }
    function visibility() {
      if (document.hidden) {
        clearTimeout(timer);
        return;
      }
      if (!hasLoaded || Date.now() >= nextDue) void run(false);
      else schedule();
    }
    refreshRef.current = () => {
      void run(true);
    };
    document.addEventListener("visibilitychange", visibility);
    void run(false);
    return () => {
      disposed = true;
      controller?.abort();
      clearTimeout(timer);
      clearTimeout(cooldownTimer);
      document.removeEventListener("visibilitychange", visibility);
      refreshRef.current = () => {};
    };
  }, [read, interval]);

  const refresh = useCallback(() => refreshRef.current(), []);
  return { ...snapshot, refresh, cooldown };
}
