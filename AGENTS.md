# AGENTS.md

## Commands

- Package manager is **Bun** (not npm/pnpm). Use `bun install`, `bun run index.ts`.
- Typecheck: `bun check` (single command; Bun 1.4 native typecheck). This is the only verification step in `package.json` — there are no tests or linters yet.
- Final goal is a standalone binary: `bun build ./index.ts --compile --outfile weather`.

## What this app is

An interactive console weather app (Spanish-language UI) whose behavior is spec'd in `README.md` — that file is the source of truth for features. Read it before building features.

- Data source: OpenMeteo, two-step flow with no API key:
  1. Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1&language=es&format=json`
  2. Forecast: `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m`
- Features: default city, multiple saved cities, temperature unit setting (°C/°F), numbered interactive menu (see README example; exit option is `9`).
- UI labels and prompts must be in Spanish.

## Conventions

- Single entrypoint `index.ts` for now; imported modules use explicit `.ts` extensions (`allowImportingTsExtensions`, bundler resolution).
- tsconfig is strict with `noUncheckedIndexedAccess` — indexing into arrays/records yields `T | undefined`; handle it rather than disabling.
- Fresh scaffold (one commit, "Hello via Bun" in `index.ts`): don't assume existing structure or helpers beyond the tsc defaults.
