import { afterEach, describe, expect, test } from "bun:test";
import { geocode, getTemperature } from "../api.ts";

const realFetch = globalThis.fetch;

function mockFetch(handler: (url: string) => Response | Promise<Response>): void {
  globalThis.fetch = (async (input: string | URL | Request) => handler(String(input))) as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("geocode", () => {
  test("consulta el geocoding con count=5 para traer alternativas", async () => {
    let requestedUrl = "";
    mockFetch((url) => {
      requestedUrl = url;
      return jsonResponse({ results: [] });
    });
    await geocode("san jose");
    expect(requestedUrl).toContain("count=5");
    expect(requestedUrl).toContain("name=san%20jose");
  });

  test("devuelve todos los resultados con estructura completa", async () => {
    mockFetch(() =>
      jsonResponse({
        results: [
          {
            id: 12345,
            name: "San José",
            latitude: 9.9281,
            longitude: -84.0907,
            elevation: 1161,
            feature_code: "PPLC",
            country_code: "CR",
            country: "Costa Rica",
            admin1: "San José",
            timezone: "America/Costa_Rica",
            population: 342188,
          },
          {
            id: 67890,
            name: "San José",
            latitude: 37.3499,
            longitude: -121.895,
            elevation: 26,
            feature_code: "PPLA",
            country_code: "US",
            country: "Estados Unidos",
            admin1: "California",
            timezone: "America/Los_Angeles",
            population: 1013240,
          },
        ],
      }),
    );
    const geo = await geocode("san jose");
    expect(geo.ok).toBe(true);
    if (!geo.ok) return;
    expect(geo.results).toHaveLength(2);
    const expectedFirst = {
      id: 12345,
      name: "San José",
      latitude: 9.9281,
      longitude: -84.0907,
      elevation: 1161,
      feature_code: "PPLC",
      country_code: "CR",
      country: "Costa Rica",
      admin1: "San José",
      timezone: "America/Costa_Rica",
      population: 342188,
    };
    expect(geo.results[0]).toEqual(expectedFirst);
  });

  test("sin resultados devuelve error indicando la ciudad buscada", async () => {
    mockFetch(() => jsonResponse({ results: [] }));
    const geo = await geocode("zzzz no existe");
    expect(geo).toEqual({ ok: false, error: 'No se encontró la ciudad "zzzz no existe".' });
  });

  test("filtra resultados sin coordenadas numéricas", async () => {
    mockFetch(() =>
      jsonResponse({
        results: [
          { name: "Rota", latitude: "36", longitude: "-6" },
          { name: "SinCoords" },
        ],
      }),
    );
    const geo = await geocode("rota");
    expect(geo).toEqual({ ok: false, error: 'No se encontró la ciudad "rota".' });
  });

  test("error HTTP devuelve mensaje con el status", async () => {
    mockFetch(() => new Response("boom", { status: 503 }));
    const geo = await geocode("ottawa");
    expect(geo).toEqual({ ok: false, error: "Error en la búsqueda (503)." });
  });

  test("excepción de red devuelve error de conexión", async () => {
    mockFetch(() => {
      throw new TypeError("fetch failed");
    });
    const geo = await geocode("ottawa");
    expect(geo).toEqual({
      ok: false,
      error: "No se pudo conectar con el servicio de geocoding. Revisa tu conexión.",
    });
  });
});

describe("getTemperature", () => {
  test("devuelve la temperatura actual en grados", async () => {
    mockFetch(() => jsonResponse({ current: { temperature_2m: 21.5, unit: "celsius" } }));
    const forecast = await getTemperature(45.41117, -75.69812);
    expect(forecast).toEqual({ ok: true, tempCelsius: 21.5 });
  });

  test("respuesta sin current devuelve datos inesperados", async () => {
    mockFetch(() => jsonResponse({}));
    const forecast = await getTemperature(45.41117, -75.69812);
    expect(forecast).toEqual({ ok: false, error: "El servicio de clima devolvió datos inesperados." });
  });

  test("temperature_2m no numérica devuelve datos inesperados", async () => {
    mockFetch(() => jsonResponse({ current: { temperature_2m: "21.5" } }));
    const forecast = await getTemperature(45.41117, -75.69812);
    expect(forecast).toEqual({ ok: false, error: "El servicio de clima devolvió datos inesperados." });
  });

  test("error HTTP devuelve mensaje con el status", async () => {
    mockFetch(() => new Response("boom", { status: 500 }));
    const forecast = await getTemperature(45.41117, -75.69812);
    expect(forecast).toEqual({ ok: false, error: "Error al consultar el clima (500)." });
  });

  test("excepción de red devuelve error de conexión", async () => {
    mockFetch(() => {
      throw new TypeError("fetch failed");
    });
    const forecast = await getTemperature(45.41117, -75.69812);
    expect(forecast).toEqual({
      ok: false,
      error: "No se pudo conectar con el servicio de clima. Revisa tu conexión.",
    });
  });
});
