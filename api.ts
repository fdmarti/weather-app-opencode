export interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
}

export type GeocodeResult =
  | { ok: true; results: GeoResult[] }
  | { ok: false; error: string };

export async function geocode(cityName: string): Promise<GeocodeResult> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=5&language=es&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { ok: false, error: `Error en la búsqueda (${res.status}).` };
    }
    const data = (await res.json()) as { results?: GeoResult[] };
    const results = (Array.isArray(data.results) ? data.results : []).filter(
      (candidate) => typeof candidate.latitude === "number" && typeof candidate.longitude === "number",
    );
    if (results.length === 0) {
      return { ok: false, error: `No se encontró la ciudad "${cityName}".` };
    }
    return { ok: true, results };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servicio de geocoding. Revisa tu conexión." };
  }
}

export type ForecastResult =
  | { ok: true; tempCelsius: number }
  | { ok: false; error: string };

export async function getTemperature(latitude: number, longitude: number): Promise<ForecastResult> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { ok: false, error: `Error al consultar el clima (${res.status}).` };
    }
    const data = (await res.json()) as {
      current?: { temperature_2m?: unknown };
    };
    const temp = data.current?.temperature_2m;
    if (typeof temp !== "number") {
      return { ok: false, error: "El servicio de clima devolvió datos inesperados." };
    }
    return { ok: true, tempCelsius: temp };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servicio de clima. Revisa tu conexión." };
  }
}

export function celsiusToFahrenheit(tempCelsius: number): number {
  return tempCelsius * (9 / 5) + 32;
}
