import type { Database } from "../types/Database.ts";
import { sameCity } from "../utils/city.ts";
import { cityLabel } from "../utils/format.ts";
import { promptIndex } from "../presentation/input.ts";
import { printError, printNumbered, printSuccess } from "../presentation/output.ts";
import { saveDatabase } from "../storage/citiesStorage.ts";

/** Opción 5: elimina una ciudad de la lista guardada. */
export async function deleteCity(db: Database): Promise<void> {
  if (db.cities.length === 0) {
    printError("No hay ciudades guardadas.");
    return;
  }
  printNumbered(db.cities, cityLabel);
  const index = await promptIndex("Selecciona la ciudad a eliminar: ", db.cities.length);
  if (index === null) {
    return;
  }
  const removed = db.cities[index];
  if (!removed) {
    return;
  }

  db.cities.splice(index, 1);
  if (db.defaultCity && sameCity(db.defaultCity, removed)) {
    db.defaultCity = null;
    printError("La ciudad eliminada era la default, ahora no hay ciudad default.");
  }
  saveDatabase(db);
  printSuccess(`Ciudad "${cityLabel(removed)}" eliminada.`);
}
