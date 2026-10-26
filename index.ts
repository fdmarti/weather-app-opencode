import { celsiusToFahrenheit, geocode, getTemperature } from "./api.ts";
import { isCitySaved, loadDatabase, saveDatabase, type Database, type SavedCity } from "./storage.ts";
import { INPUT_ENDED, LINE, closeInput, pause, printBanner, printMenu, prompt, promptNumber } from "./ui.ts";

function formatTemperature(tempCelsius: number, db: Database): string {
  if (db.unit === "F") {
    return `${celsiusToFahrenheit(tempCelsius).toFixed(1)} °F`;
  }
  return `${tempCelsius.toFixed(1)} °C`;
}

function cityLabel(city: SavedCity): string {
  return city.country ? `${city.name}, ${city.country}` : city.name;
}

async function showCityWeather(city: SavedCity, db: Database): Promise<void> {
  const forecast = await getTemperature(city.latitude, city.longitude);
  if (!forecast.ok) {
    console.log(`  ${city.name}: ${forecast.error}`);
    return;
  }
  console.log(`  ${cityLabel(city)}: ${formatTemperature(forecast.tempCelsius, db)}`);
}

async function findDefaultCity(db: Database): Promise<SavedCity | null | undefined> {
  // null → no hay default; undefined → el default existe pero hay que geocodificarlo
  if (!db.defaultCity) return null;
  const saved = db.cities.find((city) => city.name.toLowerCase() === db.defaultCity!.toLowerCase());
  if (saved) return saved;
  const geo = await geocode(db.defaultCity);
  return geo.ok ? geo.result : null;
}

async function optionDefaultWeather(db: Database): Promise<void> {
  const city = await findDefaultCity(db);
  if (!city) {
    console.log(`  No hay ciudad default configurada. Usa la opción 3 para agregar una${db.defaultCity ? " (la default guardada ya no es válida)." : "."}`);
    return;
  }
  await showCityWeather(city, db);
}

async function optionAllWeather(db: Database): Promise<void> {
  if (db.cities.length === 0) {
    console.log("  No hay ciudades guardadas. Usa la opción 3 para agregar una.");
    return;
  }
  for (const city of db.cities) {
    await showCityWeather(city, db);
  }
}

async function optionSearchAndAdd(db: Database): Promise<void> {
  const name = await prompt("  Nombre de la ciudad: ");
  if (!name) {
    console.log("  Búsqueda cancelada.");
    return;
  }
  if (isCitySaved(db, name)) {
    console.log(`  "${name}" ya está en tus ciudades guardadas.`);
    return;
  }
  console.log(`  Buscando "${name}"...`);
  const geo = await geocode(name);
  if (!geo.ok) {
    console.log(`  ${geo.error}`);
    return;
  }
  const found: SavedCity = {
    name: geo.result.name,
    country: geo.result.country,
    latitude: geo.result.latitude,
    longitude: geo.result.longitude,
  };
  console.log(`  Encontrado: ${cityLabel(found)} (${found.latitude.toFixed(2)}, ${found.longitude.toFixed(2)})`);
  db.cities.push(found);
  if (!db.defaultCity) {
    db.defaultCity = found.name;
    console.log(`  Se estableció "${found.name}" como ciudad default.`);
  }
  const setDefault = (await prompt("  ¿Establecer como ciudad default? (s/n): ")).toLowerCase();
  if (setDefault === "s" || setDefault === "si" || setDefault === "sí") {
    db.defaultCity = found.name;
    console.log(`  "${found.name}" ahora es la ciudad default.`);
  }
  saveDatabase(db);
  console.log(`  Ciudad agregada. Total: ${db.cities.length}.`);
}

async function pickCity(db: Database, action: string): Promise<SavedCity | null> {
  if (db.cities.length === 0) {
    console.log("  No hay ciudades guardadas. Usa la opción 3 para agregar una.");
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
  console.log(`  Ciudad eliminada. Total: ${db.cities.length}.`);
}

async function optionSetDefault(db: Database): Promise<void> {
  const city = await pickCity(db, "establecer como default");
  if (!city) return;
  db.defaultCity = city.name;
  saveDatabase(db);
  console.log(`  "${city.name}" ahora es la ciudad default.`);
}

function optionToggleUnit(db: Database): void {
  db.unit = db.unit === "C" ? "F" : "C";
  saveDatabase(db);
  console.log(`  Unidad de temperatura cambiada a °${db.unit}.`);
}

async function main(): Promise<void> {
  const db = loadDatabase();

  while (true) {
    printMenu(db);
    const option = await prompt("  Selecciona una opción: ");

    if (option === INPUT_ENDED) {
      console.log("");
      console.log("  Entrada cerrada. ¡Hasta luego!");
      return;
    }

    switch (option) {
      case "1":
        await optionDefaultWeather(db);
        break;
      case "2":
        await optionAllWeather(db);
        break;
      case "3":
        await optionSearchAndAdd(db);
        break;
      case "4":
        await optionDeleteCity(db);
        break;
      case "5":
        await optionSetDefault(db);
        break;
      case "6":
        optionToggleUnit(db);
        break;
      case "7":
        console.log("");
        printBanner();
        console.log("         ¡Hasta luego!");
        console.log(LINE);
        closeInput();
        return;
      default:
        console.log("  Opción no válida. Elige un número del 1 al 7.");
    }

    await pause();
  }
}

await main();
