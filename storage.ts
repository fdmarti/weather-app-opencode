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

const DB_DIR = "database";
const DB_PATH = `${DB_DIR}/cities.json`;

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

export function loadDatabase(): Database {
  try {
    if (!existsSync(DB_PATH)) return { ...EMPTY_DB, cities: [] };
    const raw = readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      defaultCity: typeof parsed.defaultCity === "string" ? parsed.defaultCity : null,
      unit: parsed.unit === "F" ? "F" : "C",
      cities: Array.isArray(parsed.cities) ? parsed.cities.filter(isSavedCity) : [],
    };
  } catch {
    console.log("Aviso: no se pudo leer database/cities.json, se empieza con una configuración vacía.");
    return { ...EMPTY_DB, cities: [] };
  }
}

export function saveDatabase(db: Database): void {
  mkdirSync(DB_DIR, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function isCitySaved(db: Database, name: string): boolean {
  return db.cities.some((city) => city.name.toLowerCase() === name.toLowerCase());
}
