import { celsiusToFahrenheit, geocode, getTemperature, type GeoResult } from "./api.ts";
import { GREEN, RED, RESET, YELLOW } from "./colors.ts";
import { isCitySaved, loadDatabase, saveDatabase, type Database, type SavedCity } from "./storage.ts";
import { INPUT_ENDED, LINE, closeInput, pause, printBanner, printMenu, prompt, promptNumber, withLoading, type MenuItem } from "./ui.ts";

function formatTemperature(tempCelsius: number, db: Database): string {
  if (db.unit === "F") {
    return `${YELLOW}${celsiusToFahrenheit(tempCelsius).toFixed(1)} °F${RESET}`;
  }
  return `${YELLOW}${tempCelsius.toFixed(1)} °C${RESET}`;
}

function cityLabel(city: SavedCity): string {
  return city.country ? `${city.name}, ${city.country}` : city.name;
}

async function showCityWeather(city: SavedCity, db: Database): Promise<void> {
  const forecast = await withLoading(`Consultando clima de ${city.name}...`, () =>
    getTemperature(city.latitude, city.longitude),
  );
  if (!forecast.ok) {
    console.log(`  ${city.name}: ${RED}${forecast.error}${RESET}`);
    return;
  }
  console.log(`  ${cityLabel(city)}: ${formatTemperature(forecast.tempCelsius, db)}`);
}

async function findDefaultCity(db: Database): Promise<SavedCity | null | undefined> {
  // null → no hay default; undefined → el default existe pero hay que geocodificarlo
  const defaultCity = db.defaultCity;
  if (!defaultCity) return null;
  const saved = db.cities.find((city) => city.name.toLowerCase() === defaultCity.toLowerCase());
  if (saved) return saved;
  const geo = await withLoading(`Buscando "${defaultCity}"...`, () => geocode(defaultCity));
  return geo.ok ? geo.results[0] ?? null : null;
}

async function optionDefaultWeather(db: Database): Promise<void> {
  const city = await findDefaultCity(db);
  if (!city) {
    console.log(`  ${RED}No hay ciudad default configurada. Usa la opción 3 para agregar una${db.defaultCity ? " (la default guardada ya no es válida)." : "."}${RESET}`);
    return;
  }
  await showCityWeather(city, db);
}

async function optionAllWeather(db: Database): Promise<void> {
  if (db.cities.length === 0) {
    console.log(`  ${RED}No hay ciudades guardadas. Usa la opción 3 para agregar una.${RESET}`);
    return;
  }
  const forecasts = await withLoading(`Consultando clima de ${db.cities.length} ciudades...`, () =>
    Promise.all(db.cities.map((city) => getTemperature(city.latitude, city.longitude))),
  );
  db.cities.forEach((city, index) => {
    const forecast = forecasts[index];
    if (!forecast) return;
    if (!forecast.ok) {
      console.log(`  ${city.name}: ${forecast.error}`);
      return;
    }
    console.log(`  ${cityLabel(city)}: ${formatTemperature(forecast.tempCelsius, db)}`);
  });
}

async function chooseGeoResult(results: GeoResult[]): Promise<GeoResult | null> {
  if (results.length === 1) return results[0] ?? null;
  console.log(`  Se encontraron ${results.length} coincidencias:`);
  results.forEach((result, index) => {
    const label = result.country ? `${result.name}, ${result.country}` : result.name;
    console.log(`    ${index + 1}. ${label}`);
  });
  console.log(`    0. Cancelar`);
  const selection = await promptNumber("  Número de la ciudad a agregar: ");
  if (selection < 1 || selection > results.length) {
    console.log("  Búsqueda cancelada.");
    return null;
  }
  return results[selection - 1] ?? null;
}

async function optionSearchAndAdd(db: Database): Promise<void> {
  const name = await prompt("  Nombre de la ciudad: ");
  if (!name) {
    console.log("  Búsqueda cancelada.");
    return;
  }
  if (isCitySaved(db, name)) {
    console.log(`  ${RED}"${name}" ya está en tus ciudades guardadas.${RESET}`);
    return;
  }
  const geo = await withLoading(`Buscando "${name}"...`, () => geocode(name));
  if (!geo.ok) {
    console.log(`  ${RED}${geo.error}${RESET}`);
    return;
  }
  const chosen = await chooseGeoResult(geo.results);
  if (!chosen) return;
  const found: SavedCity = {
    name: chosen.name,
    country: chosen.country,
    latitude: chosen.latitude,
    longitude: chosen.longitude,
  };
  console.log(`  ${GREEN}Encontrado: ${cityLabel(found)} (${found.latitude.toFixed(2)}, ${found.longitude.toFixed(2)})${RESET}`);
  db.cities.push(found);
  if (!db.defaultCity) {
    db.defaultCity = found.name;
    console.log(`  ${GREEN}Se estableció "${found.name}" como ciudad default.${RESET}`);
  }
  const setDefault = (await prompt("  ¿Establecer como ciudad default? (s/n): ")).toLowerCase();
  if (setDefault === "s" || setDefault === "si" || setDefault === "sí") {
    db.defaultCity = found.name;
    console.log(`  ${GREEN}"${found.name}" ahora es la ciudad default.${RESET}`);
  }
  saveDatabase(db);
  console.log(`  ${GREEN}Ciudad agregada. Total: ${db.cities.length}.${RESET}`);
}

async function pickCity(db: Database, action: string): Promise<SavedCity | null> {
  if (db.cities.length === 0) {
    console.log(`  ${RED}No hay ciudades guardadas. Usa la opción 3 para agregar una.${RESET}`);
    return null;
  }
  console.log("  Ciudades guardadas:");
  db.cities.forEach((city, index) => {
    const marker = city.name === db.defaultCity ? " (default)" : "";
    console.log(`    ${index + 1}. ${cityLabel(city)}${marker}`);
  });
  console.log(`    0. Cancelar`);
  const selection = await promptNumber(`  Número de la ciudad a ${action}: `);
  if (selection < 1 || selection > db.cities.length) {
    console.log("  Operación cancelada.");
    return null;
  }
  return db.cities[selection - 1] ?? null;
}

async function optionDeleteCity(db: Database): Promise<void> {
  const city = await pickCity(db, "eliminar");
  if (!city) return;
  db.cities = db.cities.filter((c) => c !== city);
  if (db.defaultCity === city.name) {
    db.defaultCity = null;
    console.log(`  "${city.name}" era la ciudad default; ahora no hay default.`);
  }
  saveDatabase(db);
  console.log(`  ${GREEN}Ciudad eliminada. Total: ${db.cities.length}.${RESET}`);
}

async function optionSetDefault(db: Database): Promise<void> {
  const city = await pickCity(db, "establecer como default");
  if (!city) return;
  db.defaultCity = city.name;
  saveDatabase(db);
  console.log(`  ${GREEN}"${city.name}" ahora es la ciudad default.${RESET}`);
}

function optionToggleUnit(db: Database): void {
  db.unit = db.unit === "C" ? "F" : "C";
  saveDatabase(db);
  console.log(`  ${GREEN}Unidad de temperatura cambiada a °${db.unit}.${RESET}`);
}

async function optionExit(): Promise<void> {}

function buildMenu(): MenuItem[] {
  return [
    { key: "1", label: () => "Clima de ciudad default", run: optionDefaultWeather },
    { key: "2", label: (db) => `Clima de todas las ciudades (${db.cities.length})`, run: optionAllWeather },
    { key: "3", label: () => "Buscar y agregar ciudad", run: optionSearchAndAdd },
    { key: "4", label: () => "Eliminar ciudad", run: optionDeleteCity },
    { key: "5", label: () => "Establecer ciudad default", run: optionSetDefault },
    { key: "8", label: (db) => `Ajustes (°${db.unit})`, run: async (db) => optionToggleUnit(db) },
    { key: "9", label: () => "Salir", run: async () => optionExit(), exit: true },
  ];
}

async function main(): Promise<void> {
  const db = loadDatabase();
  const menu = buildMenu();

  while (true) {
    printMenu(menu, db);
    const option = await prompt("  Selecciona una opción: ");

    if (option === INPUT_ENDED) {
      console.log("");
      console.log("  Entrada cerrada. ¡Hasta luego!");
      return;
    }

    const item = menu.find((entry) => entry.key === option);
    if (!item) {
      const lastKey = menu[menu.length - 1]?.key ?? "9";
      console.log(`  ${RED}Opción no válida. Elige un número del 1 al ${lastKey}.${RESET}`);
      await pause();
      continue;
    }

    await item.run(db);

    if (item.exit) {
      console.log("");
      printBanner();
      console.log("         ¡Hasta luego!");
      console.log(LINE);
      closeInput();
      return;
    }

    await pause();
  }
}

await main();
