import { z } from "zod";
import type {
  BatteryHealthView,
  CarView,
  ChargeView,
  DriveView,
  StatusView,
} from "./types";

const number = z
  .number()
  .finite()
  .nullish()
  .transform((v) => v ?? null);
const positive = z
  .number()
  .finite()
  .nonnegative()
  .nullish()
  .transform((v) => v ?? null);
const percent = z
  .number()
  .finite()
  .min(0)
  .max(100)
  .nullish()
  .transform((v) => v ?? null);
const text = z
  .string()
  .nullish()
  .transform((v) => v?.trim() || null);
const date = z
  .union([z.iso.datetime({ offset: true }), z.literal("")])
  .nullish()
  .transform((v) => v || null);
const id = z.number().int().positive();
const units = z.object({ unit_of_length: z.enum(["km", "mi"]) });
const historyUnits = z.object({ unit_of_length: z.enum(["km", "mi", ""]) });
const carRef = z.object({ car_id: id });
const battery = z
  .object({ battery_level: percent, est_battery_range: positive })
  .nullish();

export function normalizeCars(input: unknown): CarView[] {
  const { data } = z
    .object({
      data: z.object({
        cars: z
          .array(
            z.object({
              car_id: id,
              name: text,
              car_details: z.object({ model: text }).nullish(),
            }),
          )
          .nullable(),
      }),
    })
    .parse(input);
  return (data.cars ?? []).map((c) => ({
    id: c.car_id,
    name: c.name ?? `车辆 ${c.car_id}`,
    model: c.car_details?.model ?? null,
  }));
}
export function toKm(value: number | null, unit: "km" | "mi"): number | null {
  return value === null ? null : value * (unit === "mi" ? 1.609344 : 1);
}
export function normalizeStatus(input: unknown): StatusView {
  const { data } = z
    .object({
      data: z.object({
        car: carRef,
        units,
        status: z.object({
          state: text,
          state_since: date,
          battery_details: battery,
          charging_details: z
            .object({ plugged_in: z.boolean().nullish() })
            .nullish(),
        }),
      }),
    })
    .parse(input);
  return {
    state: data.status.state,
    stateSince: data.status.state_since,
    batteryLevel: data.status.battery_details?.battery_level ?? null,
    estimatedRangeKm: toKm(
      data.status.battery_details?.est_battery_range ?? null,
      data.units.unit_of_length,
    ),
    pluggedIn: data.status.charging_details?.plugged_in ?? null,
  };
}
function newest<T extends { startedAt: string | null }>(items: T[]): T[] {
  return items.sort(
    (a, b) =>
      (b.startedAt ? Date.parse(b.startedAt) : 0) -
      (a.startedAt ? Date.parse(a.startedAt) : 0),
  );
}
export function normalizeDrives(input: unknown): DriveView[] {
  const { data } = z
    .object({
      data: z.object({
        car: carRef,
        units: historyUnits,
        drives: z
          .array(
            z.object({
              drive_id: id,
              start_date: date,
              end_date: date,
              start_address: text,
              end_address: text,
              odometer_details: z
                .object({ odometer_distance: positive })
                .nullish(),
              duration_min: positive,
              energy_consumed_net: number,
            }),
          )
          .nullable(),
      }),
    })
    .parse(input);
  if (!data.drives?.length) return [];
  const lengthUnit = units.parse(data.units).unit_of_length;
  return newest(
    data.drives.map((d) => {
      const km = toKm(
        d.odometer_details?.odometer_distance ?? null,
        lengthUnit,
      );
      return {
        id: d.drive_id,
        startedAt: d.start_date,
        endedAt: d.end_date,
        from: d.start_address,
        to: d.end_address,
        distanceKm: km,
        durationMin: d.duration_min,
        consumptionWhKm:
          km !== null && km > 0 && d.energy_consumed_net !== null
            ? (d.energy_consumed_net * 1000) / km
            : null,
      };
    }),
  );
}
export function normalizeCharges(input: unknown): ChargeView[] {
  const { data } = z
    .object({
      data: z.object({
        car: carRef,
        units: historyUnits,
        charges: z
          .array(
            z.object({
              charge_id: id,
              start_date: date,
              end_date: date,
              address: text,
              charge_energy_added: positive,
              duration_min: positive,
              battery_details: z
                .object({
                  start_battery_level: percent,
                  end_battery_level: percent,
                })
                .nullish(),
            }),
          )
          .nullable(),
      }),
    })
    .parse(input);
  if (!data.charges?.length) return [];
  units.parse(data.units);
  return newest(
    data.charges.map((c) => ({
      id: c.charge_id,
      startedAt: c.start_date,
      endedAt: c.end_date,
      location: c.address,
      energyAddedKWh: c.charge_energy_added,
      durationMin: c.duration_min,
      startBattery: c.battery_details?.start_battery_level ?? null,
      endBattery: c.battery_details?.end_battery_level ?? null,
    })),
  );
}
export function normalizeBatteryHealth(input: unknown): BatteryHealthView {
  const { data } = z
    .object({
      data: z.object({
        car: carRef,
        units,
        battery_health: z.object({
          battery_health_percentage: positive,
        }),
      }),
    })
    .parse(input);
  return { percentage: data.battery_health.battery_health_percentage };
}
