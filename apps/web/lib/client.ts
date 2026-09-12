import {
  createHttpClient,
  createMockClient,
  mockScenarios,
  type MockScenario,
} from "@z/api-client";

export const isMock = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const rawScenario = process.env.NEXT_PUBLIC_MOCK_SCENARIO ?? "normal";
const scenario = mockScenarios.includes(rawScenario as MockScenario)
  ? (rawScenario as MockScenario)
  : "normal";
// The browser never reads an upstream API token or uses the upstream origin directly.
export const client = isMock ? createMockClient(scenario) : createHttpClient();
