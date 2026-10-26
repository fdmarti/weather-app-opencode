import type { Database } from "../types/Database.ts";
import { printError } from "../presentation/output.ts";
import { showWeather } from "./getWeather.ts";

/** Opción 2: clima actual de todas las ciudades guardadas. */
export async function showAllCitiesWeather(db: Database): Promise<void> {
  if (db.cities.length === 0) {
    printError("No hay ciudades guardadas. Usa la opción 4 para buscar y agregar una.");
    return;
  }
  for (const city of db.cities) {
    await showWeather(db, city);
  }
}
