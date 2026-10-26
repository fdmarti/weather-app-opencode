import type { Database } from "../types/Database.ts";
import { printSuccess } from "../presentation/output.ts";
import { saveDatabase } from "../storage/citiesStorage.ts";

/** Opción 8: alterna la unidad de temperatura entre °C y °F. */
export async function toggleUnit(db: Database): Promise<void> {
  db.unit = db.unit === "C" ? "F" : "C";
  saveDatabase(db);
  printSuccess(`Unidad de temperatura: °${db.unit}`);
}
