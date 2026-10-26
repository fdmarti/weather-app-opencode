import type { GeoCity } from "./City.ts";
import type { ApiError } from "./Weather.ts";

/** Resultado de la búsqueda de ciudades por nombre. */
export type GeocodeResult = { ok: true; cities: GeoCity[] } | ApiError;
