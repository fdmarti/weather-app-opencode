import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadDatabase, saveDatabase, type Database } from "../storage.ts";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "weather-test-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("loadDatabase", () => {
  test("devuelve una DB vacía cuando el archivo no existe", () => {
    const db = loadDatabase(dir);
    expect(db).toEqual({ defaultCity: null, unit: "C", cities: [] });
  });

  test("JSON corrupto devuelve DB vacía en vez de lanzar", () => {
    writeFileSync(join(dir, "cities.json"), "no es json {{{", "utf-8");
    const db = loadDatabase(dir);
    expect(db.defaultCity).toBeNull();
    expect(db.unit).toBe("C");
    expect(db.cities).toEqual([]);
  });

  test("filtra entradas inválidas de cities y acepta las válidas", () => {
    writeFileSync(
      join(dir, "cities.json"),
      JSON.stringify({
        defaultCity: "Valida",
        unit: "C",
        cities: [
          { name: "Valida", latitude: 1, longitude: 2 },
          { name: "SinCoordenadas" },
          { name: "CoordsComoTexto", latitude: "1", longitude: "2" },
          42,
          null,
        ],
      }),
      "utf-8",
    );
    const db = loadDatabase(dir);
    expect(db.cities).toEqual([{ name: "Valida", latitude: 1, longitude: 2 }]);
    expect(db.defaultCity).toBe("Valida");
  });

  test("unit distinta de F se normaliza a C", () => {
    writeFileSync(join(dir, "cities.json"), JSON.stringify({ unit: "K" }), "utf-8");
    expect(loadDatabase(dir).unit).toBe("C");
  });
});

describe("saveDatabase", () => {
  test("roundtrip: lo que guarda saveDatabase lo devuelve loadDatabase igual", () => {
    const db: Database = {
      defaultCity: "Junín",
      unit: "F",
      cities: [{ name: "Junín", country: "Argentina", latitude: -34.59391, longitude: -60.94644 }],
    };
    saveDatabase(db, dir);
    expect(loadDatabase(dir)).toEqual(db);
  });
});
