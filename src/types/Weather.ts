export interface ApiError {
  ok: false;
  error: string;
}

/** Resultado de la llamada de temperatura actual. */
export type TemperatureResult = { ok: true; temperature: number } | ApiError;

/** Un día del pronóstico diario. */
export interface DailyForecast {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
}

/** Resultado de la llamada de pronóstico de los próximos días. */
export type ForecastResult = { ok: true; days: DailyForecast[] } | ApiError;
