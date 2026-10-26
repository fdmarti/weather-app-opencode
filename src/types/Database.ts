import type { City } from "./City.ts";

export type Unit = "C" | "F";

/** Base de datos local: ciudades guardadas y preferencias. */
export interface Database {
  cities: City[];
  defaultCity: City | null;
  unit: Unit;
}
