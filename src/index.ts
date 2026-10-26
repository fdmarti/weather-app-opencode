import { geocode, getTemperature } from "./api.ts";
import type { GeoCity } from "./api.ts";
import { bold, yellow } from "./colors.ts";
import { loadDatabase, saveDatabase } from "./storage.ts";
import type { City, Database, Unit } from "./storage.ts";
import {
  closeReader,
  printBanner,
  printError,
  printMenu,
  printNumbered,
  printSuccess,
  prompt,
  promptIndex,
  withLoading,
} from "./ui.ts";
import type { MenuItem } from "./ui.ts";

let db: Database = loadDatabase();

function sameCity(a: City, b: City): boolean {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

function cityLabel(city: City): string {
  const parts = [city.name, city.admin1, city.country].filter((part): part is string => Boolean(part));
  return parts.join(", ");
}

function formatTemperature(value: number, unit: Unit): string {
  return `${value.toFixed(1)}°${unit}`;
}

async function showWeather(city: City): Promise<void> {
  const result = await withLoading(`Obteniendo clima de ${city.name}...`, () =>
    getTemperature(city.latitude, city.longitude, db.unit),
  );
  if (!result.ok) {
    printError(result.error);
    return;
  }
  console.log(`\n  ${bold(cityLabel(city))}`);
  console.log(`  ${yellow(formatTemperature(result.temperature, db.unit))}\n`);
}

async function showDefaultCityWeather(): Promise<void> {
  const city = db.defaultCity;
  if (!city) {
    printError("No hay ciudad por defecto. Usa la opción 5 para establecer una.");
    return;
  }
  await showWeather(city);
}

async function showAllCitiesWeather(): Promise<void> {
  if (db.cities.length === 0) {
    printError("No hay ciudades guardadas. Usa la opción 3 para buscar y agregar una.");
    return;
  }
  for (const city of db.cities) {
    await showWeather(city);
  }
}

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

async function searchAndAddCity(): Promise<void> {
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

async function deleteCity(): Promise<void> {
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

async function setDefaultCity(): Promise<void> {
  if (db.cities.length === 0) {
    printError("No hay ciudades guardadas. Usa la opción 3 para buscar y agregar una.");
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

async function toggleUnit(): Promise<void> {
  db.unit = db.unit === "C" ? "F" : "C";
  saveDatabase(db);
  printSuccess(`Unidad de temperatura: °${db.unit}`);
}

async function exitApp(): Promise<void> {
  closeReader();
  console.log(`\n  ${bold("¡Hasta luego!")}\n`);
}

const menuItems: MenuItem[] = [
  { key: "1", label: () => "Clima de ciudad default", run: showDefaultCityWeather },
  { key: "2", label: (database) => `Clima de todas las ciudades (${database.cities.length})`, run: showAllCitiesWeather },
  { key: "3", label: () => "Buscar y agregar ciudad", run: searchAndAddCity },
  { key: "4", label: () => "Eliminar ciudad", run: deleteCity },
  { key: "5", label: () => "Establecer ciudad default", run: setDefaultCity },
  { key: "8", label: (database) => `Ajustes (°${database.unit})`, run: toggleUnit },
  { key: "9", label: () => "Salir", run: exitApp, exit: true },
];

async function main(): Promise<void> {
  printBanner();
  let running = true;
  while (running) {
    printMenu(menuItems, db);
    const option = await prompt("Selecciona una opción: ");
    const item = menuItems.find((entry) => entry.key === option);
    if (!item) {
      printError("Opción no válida, intenta de nuevo.");
      continue;
    }
    await item.run();
    if (item.exit) {
      running = false;
    }
  }
}

process.on("SIGINT", () => {
  closeReader();
  process.exit(0);
});

main().catch((error: unknown) => {
  closeReader();
  console.error(error);
  process.exit(1);
});
