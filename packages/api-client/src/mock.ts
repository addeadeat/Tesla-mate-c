import {
  carsFixture,
  chargesFixture,
  drivesFixture,
  healthFixture,
  statusFixture,
} from "./fixtures";
import {
  normalizeBatteryHealth,
  normalizeCars,
  normalizeCharges,
  normalizeDrives,
  normalizeStatus,
} from "./normalize";
import { assertCarId } from "./policy";
import type { TeslaMateClient } from "./types";

export type MockScenario =
  | "normal"
  | "loading"
  | "empty"
  | "no-cars"
  | "error"
  | "online"
  | "asleep"
  | "charging"
  | "driving"
  | "missing";
export const mockScenarios: MockScenario[] = [
  "normal",
  "loading",
  "empty",
  "no-cars",
  "error",
  "online",
  "asleep",
  "charging",
  "driving",
  "missing",
];
export function createMockClient(
  scenario: MockScenario = "normal",
  latency = 450,
): TeslaMateClient {
  function wait(signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (signal?.aborted)
        return reject(new DOMException("Aborted", "AbortError"));
      const done = () => {
        signal?.removeEventListener("abort", abort);
        resolve();
      };
      const timer =
        scenario === "loading" ? undefined : setTimeout(done, latency);
      const abort = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        reject(new DOMException("Aborted", "AbortError"));
      };
      signal?.addEventListener("abort", abort, { once: true });
    }).then(() => {
      if (scenario === "error")
        throw new Error("模拟 API 暂不可用，请稍后重试");
    });
  }
  return {
    mode: "mock",
    async cars(signal) {
      await wait(signal);
      return normalizeCars(
        scenario === "no-cars" ? { data: { cars: [] } } : carsFixture,
      );
    },
    async status(id, signal) {
      assertCarId(id);
      await wait(signal);
      const fixture = structuredClone(statusFixture);
      if (["online", "asleep", "charging", "driving"].includes(scenario))
        fixture.data.status.state = scenario;
      if (scenario === "charging")
        fixture.data.status.charging_details = { plugged_in: true };
      if (scenario === "missing") {
        fixture.data.status.battery_details = {};
        fixture.data.status.charging_details = {};
      }
      return normalizeStatus(fixture);
    },
    async drives(id, signal) {
      assertCarId(id);
      await wait(signal);
      return normalizeDrives(
        scenario === "empty"
          ? { data: { ...drivesFixture.data, drives: [] } }
          : drivesFixture,
      );
    },
    async charges(id, signal) {
      assertCarId(id);
      await wait(signal);
      return normalizeCharges(
        scenario === "empty"
          ? { data: { ...chargesFixture.data, charges: [] } }
          : chargesFixture,
      );
    },
    async batteryHealth(id, signal) {
      assertCarId(id);
      await wait(signal);
      return normalizeBatteryHealth(healthFixture);
    },
  };
}
