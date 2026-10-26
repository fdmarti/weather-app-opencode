import type { Unit } from "./storage.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS = 10_000;

export interface GeoCity {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type GeocodeResult = { ok: true; cities: GeoCity[] } | ApiError;
export type ForecastResult = { ok: true; temperature: number } | ApiError;

// Respuestas con campos opcionales y desconocidos: se validan en runtime.
interface GeocodingResponse {
  results?: Array<{
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    country?: unknown;
    admin1?: unknown;
  }>;
}

interface ForecastResponse {
  current?: { temperature_2m?: unknown };
}

/** Paso 1: busca ciudades por nombre (hasta 5 resultados). Nunca lanza excepciones. */
export async function geocode(name: string): Promise<GeocodeResult> {
  const query = name.trim();
  if (!query) {
    return { ok: false, error: "Debes ingresar el nombre de una ciudad." };
  }

  try {
    const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=es&format=json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) {
      return { ok: false, error: `El servicio de geocoding respondió con error ${response.status}.` };
    }

    const data = (await response.json()) as GeocodingResponse;
    const cities: GeoCity[] = [];
    for (const result of data.results ?? []) {
      if (typeof result.name !== "string" || typeof result.latitude !== "number" || typeof result.longitude !== "number") {
        continue;
      }
      cities.push({
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
        country: typeof result.country === "string" ? result.country : undefined,
        admin1: typeof result.admin1 === "string" ? result.admin1 : undefined,
      });
    }

    if (cities.length === 0) {
      return { ok: false, error: `No se encontraron ciudades para "${query}".` };
    }
    return { ok: true, cities };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servicio de geocoding." };
  }
}

/** Paso 2: temperatura actual para unas coordenadas. Nunca lanza excepciones. */
export async function getTemperature(latitude: number, longitude: number, unit: Unit): Promise<ForecastResult> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: "temperature_2m",
    });
    if (unit === "F") {
      params.set("temperature_unit", "fahrenheit");
    }

    const response = await fetch(`${FORECAST_URL}?${params.toString()}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) {
      return { ok: false, error: `El servicio de clima respondió con error ${response.status}.` };
    }

    const data = (await response.json()) as ForecastResponse;
    const temperature = data.current?.temperature_2m;
    if (typeof temperature !== "number") {
      return { ok: false, error: "El servicio de clima no devolvió la temperatura." };
    }
    return { ok: true, temperature };
  } catch {
    return { ok: false, error: "No se pudo obtener el pronóstico del clima." };
  }
}
