import type { GeoCity } from "../types/City.ts";
import type { GeocodeResult } from "../types/Geocode.ts";
import { GEOCODING_URL, TIMEOUT_MS } from "../utils/constants.ts";

// Respuesta con campos opcionales y desconocidos: se validan en runtime.
interface GeocodingResponse {
  results?: Array<{
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    country?: unknown;
    admin1?: unknown;
  }>;
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
