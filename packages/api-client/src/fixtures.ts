import type {
  BatteryHealthResponse,
  CarsResponse,
  ChargesResponse,
  DrivesResponse,
  StatusResponse,
} from "./types";

// Entirely fictional values. No VIN, exact coordinates or user journey data.
const car = { car_id: 1, car_name: "我的座驾" };
const units = { unit_of_length: "km" as const };
export const carsFixture: CarsResponse = {
  data: {
    cars: [{ car_id: 1, name: "我的座驾", car_details: { model: "Model 3" } }],
  },
};
export const statusFixture: StatusResponse = {
  data: {
    car,
    units,
    status: {
      state: "asleep",
      state_since: "2026-09-12T00:15:00Z",
      battery_details: { battery_level: 72, est_battery_range: 318 },
      charging_details: { plugged_in: false },
    },
  },
};
export const drivesFixture: DrivesResponse = {
  data: {
    car,
    units,
    drives: [
      {
        drive_id: 3,
        start_date: "2026-09-11T10:20:00Z",
        end_date: "2026-09-11T10:52:00Z",
        start_address: "工作地点",
        end_address: "家",
        odometer_details: { odometer_distance: 24.6 },
        duration_min: 32,
        energy_consumed_net: 3.54,
      },
      {
        drive_id: 2,
        start_date: "2026-09-11T00:05:00Z",
        end_date: "2026-09-11T00:40:00Z",
        start_address: "家",
        end_address: "工作地点",
        odometer_details: { odometer_distance: 25.1 },
        duration_min: 35,
        energy_consumed_net: 3.96,
      },
      {
        drive_id: 1,
        start_date: "2026-09-10T11:30:00Z",
        end_date: "2026-09-10T11:48:00Z",
        start_address: "街区咖啡店",
        end_address: "家",
        odometer_details: { odometer_distance: 8.2 },
        duration_min: 18,
        energy_consumed_net: 1.3,
      },
    ],
  },
};
export const chargesFixture: ChargesResponse = {
  data: {
    car,
    units,
    charges: [
      {
        charge_id: 2,
        start_date: "2026-09-10T14:10:00Z",
        end_date: "2026-09-10T18:40:00Z",
        address: "家用充电位",
        charge_energy_added: 28.4,
        duration_min: 270,
        battery_details: { start_battery_level: 31, end_battery_level: 80 },
      },
      {
        charge_id: 1,
        start_date: "2026-09-07T05:10:00Z",
        end_date: "2026-09-07T05:38:00Z",
        address: "途中充电站",
        charge_energy_added: 22.8,
        duration_min: 28,
        battery_details: { start_battery_level: 25, end_battery_level: 65 },
      },
    ],
  },
};
export const healthFixture: BatteryHealthResponse = {
  data: { car, units, battery_health: { battery_health_percentage: 96.8 } },
};
