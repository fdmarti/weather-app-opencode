import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { madrid } from "../fixtures/cities.ts";
import { createDatabase, loadDatabase, saveDatabase } from "../../src/storage/citiesStorage.ts";

const directories: string[] = [];
function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "weather-test-"));
  directories.push(directory);
  return directory;
}
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

describe("citiesStorage", () => {
  test("crea la base inicial", () => expect(createDatabase()).toEqual({ cities: [], defaultCity: null, unit: "C" }));

  test("devuelve una base vacía si el archivo no existe o está corrupto", () => {
    const directory = temporaryDirectory();
    expect(loadDatabase(directory)).toEqual(createDatabase());
    writeFileSync(join(directory, "cities.json"), "{");
    expect(loadDatabase(directory)).toEqual(createDatabase());
  });

  test("guarda, carga y normaliza los valores", () => {
    const directory = temporaryDirectory();
    const database = { cities: [madrid], defaultCity: madrid, unit: "F" as const };
    saveDatabase(database, directory);
    expect(existsSync(join(directory, "cities.json"))).toBe(true);
    expect(loadDatabase(directory)).toEqual(database);
  });
});
