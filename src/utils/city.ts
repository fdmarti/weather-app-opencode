import type { GeoCity } from "../types/City.ts";

/** Compara dos ciudades por coordenadas (la identidad geográfica). */
export function sameCity(a: GeoCity, b: GeoCity): boolean {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}
