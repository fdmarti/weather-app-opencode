import type { Database } from "../../src/types/Database.ts";
import { madrid } from "./cities.ts";

export function database(overrides: Partial<Database> = {}): Database {
  return { cities: [madrid], defaultCity: madrid, unit: "C", ...overrides };
}
