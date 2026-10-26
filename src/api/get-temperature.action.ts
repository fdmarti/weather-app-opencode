import type { Unit } from "../types/Database.ts";
import type { TemperatureResult } from "../types/Weather.ts";
import { FORECAST_URL, TIMEOUT_MS } from "../utils/constants.ts";

interface ForecastResponse {
  current?: { temperature_2m?: unknown };
}

/** Paso 2: temperatura actual para unas coordenadas. Nunca lanza excepciones. */
export async function getTemperature(latitude: number, longitude: number, unit: Unit): Promise<TemperatureResult> {
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
