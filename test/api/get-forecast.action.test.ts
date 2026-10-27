import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { getWeeklyForecast } from "../../src/api/get-forecast.action.ts";

afterEach(() => mock.restore());

describe("getWeeklyForecast", () => {
  test("forma el pronóstico válido y omite filas inválidas", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      daily: {
        time: ["2026-10-26", "mal"], temperature_2m_max: [20, "x"], temperature_2m_min: [10, 3],
      }
    })));

    await expect(getWeeklyForecast(40, -3, "F")).resolves.toEqual({
      ok: true, days: [{ date: "2026-10-26", temperatureMax: 20, temperatureMin: 10 }],
    });
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("forecast_days=7");
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("temperature_unit=fahrenheit");
  });

  test("informa cuando no hay pronóstico útil", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ daily: {} })));
    await expect(getWeeklyForecast(0, 0, "C")).resolves.toEqual({ ok: false, error: "El servicio de clima no devolvió el pronóstico diario." });
  });
});
