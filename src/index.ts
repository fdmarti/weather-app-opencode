import { searchAndAddCity } from "./actions/addCity.ts";
import { exitApp } from "./actions/exit.ts";
import { forecastSavedCity } from "./actions/getForecast.ts";
import { showDefaultCityWeather } from "./actions/getWeather.ts";
import { showAllCitiesWeather } from "./actions/listCities.ts";
import { deleteCity } from "./actions/removeCity.ts";
import { setDefaultCity } from "./actions/setDefaultCity.ts";
import { toggleUnit } from "./actions/toggleUnit.ts";
import { printBanner, printMenu } from "./presentation/menu.ts";
import { closeReader, prompt } from "./presentation/input.ts";
import { printError } from "./presentation/output.ts";
import { loadDatabase } from "./storage/citiesStorage.ts";
import type { Database } from "./types/Database.ts";
import type { MenuItem } from "./types/MenuOption.ts";

const db: Database = loadDatabase();

const menuItems: MenuItem[] = [
  { key: "1", label: () => "Clima de ciudad default", run: () => showDefaultCityWeather(db) },
  { key: "2", label: (database) => `Clima de todas las ciudades (${database.cities.length})`, run: () => showAllCitiesWeather(db) },
  { key: "3", label: () => "Pronóstico de 7 días", run: () => forecastSavedCity(db) },
  { key: "4", label: () => "Buscar y agregar ciudad", run: () => searchAndAddCity(db) },
  { key: "5", label: () => "Eliminar ciudad", run: () => deleteCity(db) },
  { key: "6", label: () => "Establecer ciudad default", run: () => setDefaultCity(db) },
  { key: "8", label: (database) => `Ajustes (°${database.unit})`, run: () => toggleUnit(db) },
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
