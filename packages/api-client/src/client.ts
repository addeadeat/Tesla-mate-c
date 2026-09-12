import {
  normalizeBatteryHealth,
  normalizeCars,
  normalizeCharges,
  normalizeDrives,
  normalizeStatus,
} from "./normalize";
import { allowedReadPath, assertCarId } from "./policy";
import type { TeslaMateClient } from "./types";

export function createHttpClient(
  options: { base?: string; fetcher?: typeof fetch } = {},
): TeslaMateClient {
  const base = options.base ?? "/api/teslamate";
  const fetcher = options.fetcher ?? fetch;
  async function get(
    path: string,
    signal?: AbortSignal,
    history = false,
  ): Promise<unknown> {
    if (!allowedReadPath(path)) throw new Error("不允许的读取接口");
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, 12_000);
    try {
      const response = await fetcher(
        `${base}/${path}${history ? "?page=1&show=20" : ""}`,
        {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
          redirect: "error",
        },
      );
      if (!response.ok)
        throw new Error(`数据服务暂不可用（HTTP ${response.status}）`);
      try {
        return await response.json();
      } catch {
        throw new Error("数据服务返回了无法解析的响应");
      }
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  }
  function path(id: number, kind: string): string {
    assertCarId(id);
    return `cars/${id}/${kind}`;
  }
  return {
    mode: "real",
    async cars(signal) {
      return normalizeCars(await get("cars", signal));
    },
    async status(id, signal) {
      return normalizeStatus(await get(path(id, "status"), signal));
    },
    async drives(id, signal) {
      return normalizeDrives(await get(path(id, "drives"), signal, true));
    },
    async charges(id, signal) {
      return normalizeCharges(await get(path(id, "charges"), signal, true));
    },
    async batteryHealth(id, signal) {
      return normalizeBatteryHealth(
        await get(path(id, "battery-health"), signal),
      );
    },
  };
}
