# AGENTS.md

## Commands

- Package manager is **Bun** (not npm/pnpm). Use `bun install`, `bun run index.ts`.
- Typecheck: `bun check` (Bun 1.4 native typecheck).
- Tests: `bun test` (Bun test runner). Suite in `test/`: `storage.test.ts`, `api.test.ts` (fetch mocked, no network).
- Build standalone binary: `bun run build` (= `bun build ./index.ts --compile --outfile weather`).

## What this app is

An interactive console weather app (Spanish-language UI) whose behavior is spec'd in `README.md` — that file is the source of truth for features. Read it before building features.

- Data source: OpenMeteo, two-step flow with no API key:
  1. Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=5&language=es&format=json` — returns up to 5 results; ambiguous names show a numbered list and the user picks one.
  2. Forecast: `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m`
- Features: default city, multiple saved cities, temperature unit setting (°C/°F), numbered interactive menu (see README example; options are `1-5`, `8` Ajustes, `9` Salir), spinner while async tasks run, ANSI colors (cyan menu, yellow temperatures, green success, red errors).
- User data lives in `database/cities.json`, a **relative** path (the app is local-only; running from another cwd creates `database/` there).

## Structure

- `index.ts` — entrypoint: menu option table (`MenuItem` in `ui.ts`: `{ key, label(db), run, exit }`) and the option handlers. Adding a menu option = one table entry + one handler function.
- `api.ts` — OpenMeteo clients (`geocode`, `getTemperature`), discriminated-union results `{ ok: true, ... } | { ok: false, error }`. Never throws; all failure paths return Spanish error strings.
- `storage.ts` — `loadDatabase(dir?)` / `saveDatabase(db, dir?)`; `dir` defaults to `database` (tests pass a temp dir).
- `ui.ts` — readline prompts (buffered line reader), `printMenu`/`printBanner`, `withLoading` spinner.
- `colors.ts` — raw ANSI constants, no dependencies.
- `test/` — Bun tests; `api.test.ts` mocks `globalThis.fetch`.

## Conventions

- Modules use explicit `.ts` extensions (`allowImportingTsExtensions`, bundler resolution).
- tsconfig is strict with `noUncheckedIndexedAccess` — indexing into arrays/records yields `T | undefined`; handle it rather than disabling.
- UI labels and prompts must be in Spanish.
