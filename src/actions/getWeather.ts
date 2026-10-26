import { getTemperature } from "../api/get-temperature.action.ts";
import type { City } from "../types/City.ts";
import type { Database } from "../types/Database.ts";
import { bold, yellow } from "../utils/colors.ts";
import { cityLabel, formatTemperature } from "../utils/format.ts";
import { printError, withLoading } from "../presentation/output.ts";

/** Muestra la temperatura actual de una ciudad. */
export async function showWeather(db: Database, city: City): Promise<void> {
  const result = await withLoading(`Obteniendo clima de ${city.name}...`, () =>
    getTemperature(city.latitude, city.longitude, db.unit),
  );
  if (!result.ok) {
    printError(result.error);
    return;
  }
  console.log(`\n  ${bold(cityLabel(city))}`);
  console.log(`  ${yellow(formatTemperature(result.temperature, db.unit))}\n`);
}

/** Opción 1: clima actual de la ciudad por defecto. */
export async function showDefaultCityWeather(db: Database): Promise<void> {
  const city = db.defaultCity;
  if (!city) {
    printError("No hay ciudad por defecto. Usa la opción 6 para establecer una.");
    return;
  }
  await showWeather(db, city);
}
