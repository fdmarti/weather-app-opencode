# AGENTS.md

## Commands

- Package manager is **Bun** (not npm/pnpm). Use `bun install`, `bun run src/index.ts`.
- Typecheck: `bun check` (Bun 1.4 native typecheck).
- Build standalone binary: `bun run build` (= `bun build ./src/index.ts --compile --outfile weather`).

## What this app is

An interactive console weather app (Spanish-language UI) whose behavior is spec'd in `README.md` — that file is the source of truth for features. Read it before building features.

- Data source: OpenMeteo, two-step flow with no API key:
  1. Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=5&language=es&format=json` — returns up to 5 results; ambiguous names show a numbered list and the user picks one.
  2. Forecast: `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m`
- Features: default city, multiple saved cities, temperature unit setting (°C/°F), numbered interactive menu (see README example; options are `1-5`, `8` Ajustes, `9` Salir), spinner while async tasks run, ANSI colors (cyan menu, yellow temperatures, green success, red errors).
- User data lives in `database/cities.json`, a **relative** path (the app is local-only; running from another cwd creates `database/` there).

## Structure

- `src/index.ts` — entrypoint: menu option table (`MenuItem` in `src/types/MenuOption.ts`: `{ key, label(db), run, exit }`). Adding a menu option = one table entry + one action function.
- `src/actions/` — one file per menu option (`getWeather.ts`, `listCities.ts`, `getForecast.ts`, `addCity.ts`, `removeCity.ts`, `setDefaultCity.ts`, `toggleUnit.ts`, `exit.ts`). Each exports a function that receives the `Database` as its first argument.
- `src/api/` — OpenMeteo clients, one action per file (`geocode.action.ts`, `get-temperature.action.ts`, `get-forecast.action.ts`), discriminated-union results `{ ok: true, ... } | { ok: false, error }`. Never throws; all failure paths return Spanish error strings.
- `src/presentation/` — `menu.ts` (banner/menu), `output.ts` (`printError`/`printSuccess`/`printNumbered`/`withLoading` spinner), `input.ts` (readline prompts, persistent buffered line reader).
- `src/storage/citiesStorage.ts` — `loadDatabase(dir?)` / `saveDatabase(db, dir?)`; `dir` defaults to `database` (relative to cwd).
- `src/types/` — global types: `City.ts`, `Database.ts`, `Weather.ts`, `Geocode.ts`, `MenuOption.ts`.
- `src/utils/` — `colors.ts` (raw ANSI constants), `format.ts` (`formatTemperature`/`cityLabel`/`formatDate`), `city.ts` (`sameCity`), `constants.ts` (URLs, timeouts, separators).

## Conventions

- Modules use explicit `.ts` extensions (`allowImportingTsExtensions`, bundler resolution).
- tsconfig is strict with `noUncheckedIndexedAccess` — indexing into arrays/records yields `T | undefined`; handle it rather than disabling.
- UI labels and prompts must be in Spanish.
