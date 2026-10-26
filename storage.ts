import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

export interface SavedCity {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export type Unit = "C" | "F";

export interface Database {
  defaultCity: string | null;
  unit: Unit;
  cities: SavedCity[];
}

const DEFAULT_DB_DIR = "database";

const EMPTY_DB: Database = { defaultCity: null, unit: "C", cities: [] };

function isSavedCity(value: unknown): value is SavedCity {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number"
  );
}

export function loadDatabase(dir: string = DEFAULT_DB_DIR): Database {
  const dbPath = `${dir}/cities.json`;
  try {
    if (!existsSync(dbPath)) return { ...EMPTY_DB, cities: [] };
    const raw = readFileSync(dbPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      defaultCity: typeof parsed.defaultCity === "string" ? parsed.defaultCity : null,
      unit: parsed.unit === "F" ? "F" : "C",
      cities: Array.isArray(parsed.cities) ? parsed.cities.filter(isSavedCity) : [],
    };
  } catch {
    console.log(`Aviso: no se pudo leer ${dbPath}, se empieza con una configuración vacía.`);
    return { ...EMPTY_DB, cities: [] };
  }
}

export function saveDatabase(db: Database, dir: string = DEFAULT_DB_DIR): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/cities.json`, JSON.stringify(db, null, 2), "utf-8");
}

export function isCitySaved(db: Database, name: string): boolean {
  return db.cities.some((city) => city.name.toLowerCase() === name.toLowerCase());
}
