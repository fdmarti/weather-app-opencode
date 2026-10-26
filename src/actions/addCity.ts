import { geocode } from "../api/geocode.action.ts";
import type { GeoCity } from "../types/City.ts";
import type { Database } from "../types/Database.ts";
import { sameCity } from "../utils/city.ts";
import { cityLabel } from "../utils/format.ts";
import { prompt, promptIndex } from "../presentation/input.ts";
import { printError, printNumbered, printSuccess, withLoading } from "../presentation/output.ts";
import { saveDatabase } from "../storage/citiesStorage.ts";

/** Elige una ciudad de la lista: si hay una sola la toma directo, si no muestra el listado. */
async function chooseCity(cities: GeoCity[], message: string): Promise<GeoCity | null> {
  const only = cities[0];
  if (cities.length === 1 && only) {
    return only;
  }
  printNumbered(cities, cityLabel);
  const index = await promptIndex(message, cities.length);
  return index === null ? null : (cities[index] ?? null);
}

/** Opción 4: busca una ciudad por nombre y la agrega a la lista. */
export async function searchAndAddCity(db: Database): Promise<void> {
  const name = await prompt("Nombre de la ciudad: ");
  if (!name) {
    printError("Debes ingresar el nombre de una ciudad.");
    return;
  }

  const result = await withLoading(`Buscando "${name}"...`, () => geocode(name));
  if (!result.ok) {
    printError(result.error);
    return;
  }

  const city = await chooseCity(result.cities, "Selecciona la ciudad a agregar: ");
  if (!city) {
    return;
  }
  if (db.cities.some((saved) => sameCity(saved, city))) {
    printError(`La ciudad "${cityLabel(city)}" ya está guardada.`);
    return;
  }

  db.cities.push(city);
  saveDatabase(db);
  printSuccess(`Ciudad "${cityLabel(city)}" agregada correctamente.`);
}
