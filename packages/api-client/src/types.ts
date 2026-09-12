/** Minimal upstream wire types. JSON tags checked against tobiasehlert/teslamateapi src.
 * Optional fields represent missing values in older installations, not invented fields.
 * TODO phase 2: pin the deployed image digest and verify redacted live fixtures.
 */
export type Nullable<T> = T | null;
export type Envelope<T> = { data: T };
// Upstream history handlers may leave units empty when the database returns no rows.
export type Units = { unit_of_length: "km" | "mi" | "" };
export type Car = {
  car_id: number;
  name?: Nullable<string>;
  car_details?: { model?: Nullable<string> };
};
export type CarReference = { car_id: number; car_name?: Nullable<string> };
export type CarsResponse = Envelope<{ cars: Car[] | null }>;
export type StatusResponse = Envelope<{
  car: CarReference;
  units: Units;
  status: {
    state?: Nullable<string>;
    state_since?: Nullable<string>; // state transition, NOT telemetry update time
    battery_details?: {
      battery_level?: Nullable<number>;
      est_battery_range?: Nullable<number>;
    };
    charging_details?: { plugged_in?: Nullable<boolean> };
  };
}>;
export type Drive = {
  drive_id: number;
  start_date?: Nullable<string>;
  end_date?: Nullable<string>;
  start_address?: Nullable<string>;
  end_address?: Nullable<string>;
  odometer_details?: { odometer_distance?: Nullable<number> };
  duration_min?: Nullable<number>;
  energy_consumed_net?: Nullable<number>; // kWh; may be negative after net regen
};
export type DrivesResponse = Envelope<{
  car: CarReference;
  units: Units;
  drives: Drive[] | null;
}>;
export type Charge = {
  charge_id: number;
  start_date?: Nullable<string>;
  end_date?: Nullable<string>;
  address?: Nullable<string>;
  charge_energy_added?: Nullable<number>; // kWh added to battery, not wall energy
  duration_min?: Nullable<number>;
  battery_details?: {
    start_battery_level?: Nullable<number>;
    end_battery_level?: Nullable<number>;
  };
};
export type ChargesResponse = Envelope<{
  car: CarReference;
  units: Units;
  charges: Charge[] | null;
}>;
export type BatteryHealthResponse = Envelope<{
  car: CarReference;
  units: Units;
  battery_health: {
    /** Upstream estimate. TODO: validate no-history/default-value semantics before displaying. */
    battery_health_percentage?: Nullable<number>;
  };
}>;

// View models below are owned by Z, not upstream field names.
export type CarView = { id: number; name: string; model: string | null };
export type StatusView = {
  state: string | null;
  stateSince: string | null;
  batteryLevel: number | null;
  estimatedRangeKm: number | null;
  pluggedIn: boolean | null;
};
export type DriveView = {
  id: number;
  startedAt: string | null;
  endedAt: string | null;
  from: string | null;
  to: string | null;
  distanceKm: number | null;
  durationMin: number | null;
  consumptionWhKm: number | null;
};
export type ChargeView = {
  id: number;
  startedAt: string | null;
  endedAt: string | null;
  location: string | null;
  energyAddedKWh: number | null;
  durationMin: number | null;
  startBattery: number | null;
  endBattery: number | null;
};
export type BatteryHealthView = { percentage: number | null };
export interface TeslaMateClient {
  mode: "mock" | "real";
  cars(signal?: AbortSignal): Promise<CarView[]>;
  status(carId: number, signal?: AbortSignal): Promise<StatusView>;
  drives(carId: number, signal?: AbortSignal): Promise<DriveView[]>;
  charges(carId: number, signal?: AbortSignal): Promise<ChargeView[]>;
  batteryHealth(
    carId: number,
    signal?: AbortSignal,
  ): Promise<BatteryHealthView>;
}
