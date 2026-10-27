import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { getTemperature } from "../../src/api/get-temperature.action.ts";

afterEach(() => mock.restore());

describe("getTemperature", () => {
  test("solicita Fahrenheit cuando corresponde y devuelve la temperatura", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ current: { temperature_2m: 68.5 } })));

    await expect(getTemperature(40, -3, "F")).resolves.toEqual({ ok: true, temperature: 68.5 });
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("temperature_unit=fahrenheit");
  });

  test("maneja respuestas inválidas, HTTP y red", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ current: {} })));
    await expect(getTemperature(0, 0, "C")).resolves.toEqual({ ok: false, error: "El servicio de clima no devolvió la temperatura." });

    spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 500 }));
    await expect(getTemperature(0, 0, "C")).resolves.toEqual({ ok: false, error: "El servicio de clima respondió con error 500." });
  });
});
