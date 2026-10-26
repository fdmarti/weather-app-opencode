import type { Unit } from "../types/Database.ts";
import type { DailyForecast, ForecastResult } from "../types/Weather.ts";
import { FORECAST_URL, TIMEOUT_MS } from "../utils/constants.ts";

interface ForecastResponse {
  daily?: {
    time?: unknown;
    temperature_2m_max?: unknown;
    temperature_2m_min?: unknown;
  };
}

/** Pronóstico diario (máximas y mínimas) de los próximos 7 días. Nunca lanza excepciones. */
export async function getWeeklyForecast(latitude: number, longitude: number, unit: Unit): Promise<ForecastResult> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      daily: "temperature_2m_max,temperature_2m_min",
      forecast_days: "7",
    });
    if (unit === "F") {
      params.set("temperature_unit", "fahrenheit");
    }

    const response = await fetch(`${FORECAST_URL}?${params.toString()}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) {
      return { ok: false, error: `El servicio de clima respondió con error ${response.status}.` };
    }

    const data = (await response.json()) as ForecastResponse;
    const times = data.daily?.time;
    const maxes = data.daily?.temperature_2m_max;
    const mins = data.daily?.temperature_2m_min;
    if (!Array.isArray(times) || !Array.isArray(maxes) || !Array.isArray(mins)) {
      return { ok: false, error: "El servicio de clima no devolvió el pronóstico diario." };
    }

    const days: DailyForecast[] = [];
    for (let index = 0; index < times.length; index += 1) {
      const date = times[index];
      const max = maxes[index];
      const min = mins[index];
      if (typeof date !== "string" || typeof max !== "number" || typeof min !== "number") {
        continue;
      }
      days.push({ date, temperatureMax: max, temperatureMin: min });
    }

    if (days.length === 0) {
      return { ok: false, error: "El servicio de clima no devolvió el pronóstico diario." };
    }
    return { ok: true, days };
  } catch {
    return { ok: false, error: "No se pudo obtener el pronóstico del clima." };
  }
}
