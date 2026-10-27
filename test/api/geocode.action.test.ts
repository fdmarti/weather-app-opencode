import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { geocode } from "../../src/api/geocode.action.ts";

afterEach(() => mock.restore());

describe("geocode", () => {
  test("rechaza nombres vacíos sin consultar la API", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response());

    await expect(geocode("   ")).resolves.toEqual({ ok: false, error: "Debes ingresar el nombre de una ciudad." });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("codifica la consulta y devuelve únicamente ciudades válidas", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      results: [
        { name: "Buenos Aires", latitude: -34.6, longitude: -58.4, country: "Argentina" },
        { name: "Inválida", latitude: "no", longitude: 3 },
      ],
    })));

    await expect(geocode("Buenos Aires")).resolves.toEqual({
      ok: true,
      cities: [{ name: "Buenos Aires", latitude: -34.6, longitude: -58.4, country: "Argentina", admin1: undefined }],
    });
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("name=Buenos%20Aires");
  });

  test("convierte errores HTTP, resultados vacíos y fallos de red en errores de dominio", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 503 }));
    await expect(geocode("Madrid")).resolves.toEqual({ ok: false, error: "El servicio de geocoding respondió con error 503." });

    spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ results: [] })));
    await expect(geocode("Madrid")).resolves.toEqual({ ok: false, error: 'No se encontraron ciudades para "Madrid".' });

    spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    await expect(geocode("Madrid")).resolves.toEqual({ ok: false, error: "No se pudo conectar con el servicio de geocoding." });
  });
});
