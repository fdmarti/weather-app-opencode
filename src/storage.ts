import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Unit = "C" | "F";

export interface City {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface Database {
  cities: City[];
  defaultCity: City | null;
  unit: Unit;
}

const DEFAULT_DIR = "database";

export function createDatabase(): Database {
  return { cities: [], defaultCity: null, unit: "C" };
}

/** Lee database/cities.json; si no existe o está corrupto, devuelve una base vacía. */
export function loadDatabase(dir: string = DEFAULT_DIR): Database {
  try {
    const raw = readFileSync(join(dir, "cities.json"), "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      cities: Array.isArray(parsed.cities) ? parsed.cities : [],
      defaultCity: parsed.defaultCity ?? null,
      unit: parsed.unit === "F" ? "F" : "C",
    };
  } catch {
    return createDatabase();
  }
}

/** Guarda la base de datos en <dir>/cities.json, creando el directorio si hace falta. */
export function saveDatabase(db: Database, dir: string = DEFAULT_DIR): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "cities.json"), `${JSON.stringify(db, null, 2)}\n`, "utf8");
}
