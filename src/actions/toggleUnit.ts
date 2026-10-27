import type { Database } from "../types/Database.ts";
import { printSuccess } from "../presentation/output.ts";
import { saveDatabase } from "../storage/citiesStorage.ts";

export interface ToggleUnitDependencies {
  saveDatabase: (db: Database) => void;
  printSuccess: (message: string) => void;
}

const defaultDependencies: ToggleUnitDependencies = { saveDatabase, printSuccess };

/** Opción 8: alterna la unidad de temperatura entre °C y °F. */
export async function toggleUnit(db: Database, dependencies: ToggleUnitDependencies = defaultDependencies): Promise<void> {
  db.unit = db.unit === "C" ? "F" : "C";
  dependencies.saveDatabase(db);
  dependencies.printSuccess(`Unidad de temperatura: °${db.unit}`);
}
