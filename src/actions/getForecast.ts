import { getWeeklyForecast } from "../api/get-forecast.action.ts";
import type { City } from "../types/City.ts";
import type { Database } from "../types/Database.ts";
import { bold, yellow } from "../utils/colors.ts";
import { cityLabel, formatDate, formatTemperature } from "../utils/format.ts";
import { promptIndex } from "../presentation/input.ts";
import { printError, printNumbered, withLoading } from "../presentation/output.ts";

const DATE_WIDTH = 12;
const MAX_WIDTH = 10;

/** Muestra el pronóstico de 7 días de una ciudad en forma de tabla. */
export async function showForecast(db: Database, city: City): Promise<void> {
  const result = await withLoading(`Obteniendo pronóstico de ${city.name}...`, () =>
    getWeeklyForecast(city.latitude, city.longitude, db.unit),
  );
  if (!result.ok) {
    printError(result.error);
    return;
  }

  console.log(`\n  ${bold(cityLabel(city))}`);
  console.log(`  ${"Día".padEnd(DATE_WIDTH)}${"Máx".padEnd(MAX_WIDTH)}Mín`);
  for (const day of result.days) {
    // Se agregan los espacios antes de colorear para que las columnas queden alineadas.
    const date = formatDate(day.date).padEnd(DATE_WIDTH);
    const max = yellow(formatTemperature(day.temperatureMax, db.unit).padEnd(MAX_WIDTH));
    const min = formatTemperature(day.temperatureMin, db.unit);
    console.log(`  ${date}${max}${min}`);
  }
  console.log("");
}

/** Opción 3: pronóstico de 7 días de una ciudad guardada. */
export async function forecastSavedCity(db: Database): Promise<void> {
  if (db.cities.length === 0) {
    printError("No hay ciudades guardadas. Usa la opción 4 para buscar y agregar una.");
    return;
  }

  // Si hay una sola ciudad guardada se muestra directo; si no, se elige de la lista.
  let city: City | undefined = db.cities[0];
  if (db.cities.length > 1) {
    printNumbered(db.cities, cityLabel);
    const index = await promptIndex("Selecciona la ciudad para el pronóstico: ", db.cities.length);
    if (index === null) {
      return;
    }
    city = db.cities[index];
  }
  if (!city) {
    return;
  }

  await showForecast(db, city);
}
