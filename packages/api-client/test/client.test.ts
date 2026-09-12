import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createHttpClient,
  createMockClient,
  normalizeCars,
  normalizeStatus,
  normalizeDrives,
  normalizeCharges,
  normalizeBatteryHealth,
  pollDelay,
  privateApiOrigin,
  allowedReadPath,
  formatDate,
} from "../src/index";
import {
  carsFixture,
  statusFixture,
  drivesFixture,
  chargesFixture,
  healthFixture,
} from "../src/fixtures";

test("upstream-shaped fixtures decode all five endpoint families", () => {
  assert.equal(normalizeCars(carsFixture)[0].id, 1);
  assert.equal(normalizeStatus(statusFixture).batteryLevel, 72);
  assert.equal(normalizeDrives(drivesFixture)[0].id, 3);
  assert.equal(normalizeCharges(chargesFixture)[0].energyAddedKWh, 28.4);
  assert.equal(normalizeBatteryHealth(healthFixture).percentage, 96.8);
});
test("missing values remain null; zero and false are valid", () => {
  const fixture = structuredClone(statusFixture);
  fixture.data.status.battery_details = { battery_level: 0 };
  const s = normalizeStatus(fixture);
  assert.equal(s.batteryLevel, 0);
  assert.equal(s.estimatedRangeKm, null);
  assert.equal(s.pluggedIn, false);
});
test("rated range is never passed off as estimated range", () => {
  assert.equal(
    normalizeStatus({
      data: {
        ...statusFixture.data,
        status: { battery_details: { rated_battery_range: 400 } },
      },
    }).estimatedRangeKm,
    null,
  );
});
test("mi converts to km and energy converts to Wh/km", () => {
  const fixture = structuredClone(drivesFixture);
  fixture.data.units.unit_of_length = "mi";
  fixture.data.drives![0].odometer_details = { odometer_distance: 10 };
  fixture.data.drives![0].energy_consumed_net = 2;
  const d = normalizeDrives(fixture)[0];
  assert.equal(d.distanceKm, 16.09344);
  assert(Math.abs(d.consumptionWhKm! - 124.2742384) < 0.001);
});
test("zero-distance / missing-energy consumption is absent", () => {
  const fixture = structuredClone(drivesFixture);
  fixture.data.drives![0].odometer_details = { odometer_distance: 0 };
  fixture.data.drives![1].energy_consumed_net = null;
  const d = normalizeDrives(fixture);
  assert.equal(d[0].consumptionWhKm, null);
  assert.equal(d[1].consumptionWhKm, null);
});
test("empty arrays/null arrays are empty, malformed payload is an error", () => {
  assert.deepEqual(normalizeCars({ data: { cars: null } }), []);
  assert.deepEqual(
    normalizeCharges({ data: { ...chargesFixture.data, charges: null } }),
    [],
  );
  assert.deepEqual(
    normalizeDrives({
      data: {
        ...drivesFixture.data,
        units: { unit_of_length: "" },
        drives: null,
      },
    }),
    [],
  );
  assert.throws(() =>
    normalizeDrives({
      data: { ...drivesFixture.data, units: { unit_of_length: "" } },
    }),
  );
  assert.throws(() => normalizeDrives({ data: {} }));
  assert.throws(() =>
    normalizeStatus({
      data: { ...statusFixture.data, units: { unit_of_length: "yards" } },
    }),
  );
});
test("reject impossible percentages and non-RFC3339 dates", () => {
  assert.throws(() =>
    normalizeStatus({
      data: {
        ...statusFixture.data,
        status: { battery_details: { battery_level: 101 } },
      },
    }),
  );
  assert.throws(() =>
    normalizeStatus({
      data: {
        ...statusFixture.data,
        status: { state_since: "2026-09-12 08:00" },
      },
    }),
  );
});
test("display always uses Hong Kong time, including UTC day boundary", () => {
  assert.match(formatDate("2026-09-11T18:20:00Z"), /09\/12.*02:20/);
});
test("read policy rejects control endpoints and path injection", () => {
  for (const path of ["cars", "cars/1/status", "cars/2/battery-health"])
    assert(allowedReadPath(path));
  for (const path of [
    "cars/1/command",
    "cars/1/wake_up",
    "cars/1/logging",
    "cars/../status",
    "cars/0/status",
    "https://example.com",
  ])
    assert(!allowedReadPath(path));
});
test("private API origin rejects public/wildcard URLs, credentials and paths", () => {
  for (const origin of [
    "http://127.0.0.1:8080",
    "http://192.168.1.25:8080",
    "http://teslamateapi:8080",
    "https://nas.example.ts.net",
  ])
    assert.equal(privateApiOrigin(origin), origin);
  for (const origin of [
    "http://0.0.0.0:8080",
    "http://[::]:8080",
    "https://example.com",
    "http://user:pass@127.0.0.1",
    "http://127.0.0.1/api/v1",
    "ftp://127.0.0.1",
  ])
    assert.throws(() => privateApiOrigin(origin));
});
test("conservative polling and bounded error backoff", () => {
  assert.equal(pollDelay("asleep"), 900_000);
  assert.equal(pollDelay("online"), 60_000);
  assert.equal(pollDelay(null), 300_000);
  assert.equal(pollDelay("online", 1), 120_000);
  assert.equal(pollDelay("online", 10), 900_000);
});
test("HTTP client issues only bounded read requests and no browser credentials", async () => {
  const calls: Array<{ url: string; options?: RequestInit }> = [];
  const api = createHttpClient({
    fetcher: (async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response(JSON.stringify(drivesFixture), {
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch,
  });
  await api.drives(1);
  assert.equal(calls[0].url, "/api/teslamate/cars/1/drives?page=1&show=20");
  assert.equal(calls[0].options?.method, "GET");
  assert.equal(calls[0].options?.cache, "no-store");
  assert.deepEqual(calls[0].options?.headers, { Accept: "application/json" });
  await assert.rejects(api.status(0));
  assert.equal(calls.length, 1);
});
test("HTTP errors do not leak upstream body; no automatic mock fallback", async () => {
  const api = createHttpClient({
    fetcher: (async () =>
      new Response("private database details", {
        status: 500,
      })) as typeof fetch,
  });
  await assert.rejects(
    api.cars(),
    (e) =>
      e instanceof Error &&
      e.message.includes("500") &&
      !e.message.includes("private"),
  );
  assert.equal(api.mode, "real");
  const malformed = createHttpClient({
    fetcher: (async () =>
      new Response("private non-JSON contents", {
        status: 200,
      })) as typeof fetch,
  });
  await assert.rejects(
    malformed.cars(),
    (e) => e instanceof Error && !e.message.includes("private"),
  );
});
test("mock supports empty, no-car, failure and charging scenes", async () => {
  assert.deepEqual(await createMockClient("empty", 0).drives(1), []);
  assert.deepEqual(await createMockClient("no-cars", 0).cars(), []);
  await assert.rejects(createMockClient("error", 0).cars());
  const s = await createMockClient("charging", 0).status(1);
  assert.equal(s.state, "charging");
  assert.equal(s.pluggedIn, true);
});
test("loading mock is cancellable on route exit", async () => {
  const controller = new AbortController();
  const pending = createMockClient("loading").cars(controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});
