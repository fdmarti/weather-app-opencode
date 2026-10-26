import type { Database } from "../types/Database.ts";
import { cityLabel } from "../utils/format.ts";
import { promptIndex } from "../presentation/input.ts";
import { printError, printNumbered, printSuccess } from "../presentation/output.ts";
import { saveDatabase } from "../storage/citiesStorage.ts";

/** Opción 6: marca una de las ciudades guardadas como ciudad por defecto. */
export async function setDefaultCity(db: Database): Promise<void> {
  if (db.cities.length === 0) {
    printError("No hay ciudades guardadas. Usa la opción 4 para buscar y agregar una.");
    return;
  }
  printNumbered(db.cities, cityLabel);
  const index = await promptIndex("Selecciona la ciudad default: ", db.cities.length);
  if (index === null) {
    return;
  }
  const city = db.cities[index];
  if (!city) {
    return;
  }

  db.defaultCity = city;
  saveDatabase(db);
  printSuccess(`Ciudad default: "${cityLabel(city)}".`);
}
