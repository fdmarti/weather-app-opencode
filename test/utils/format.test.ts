import { describe, expect, test } from "bun:test";
import { buenosAires, madrid } from "../fixtures/cities.ts";
import { cityLabel, formatDate, formatTemperature } from "../../src/utils/format.ts";

describe("format", () => {
  test("formatea temperaturas con un decimal y unidad", () => {
    expect(formatTemperature(18, "C")).toBe("18.0°C");
    expect(formatTemperature(-2.34, "F")).toBe("-2.3°F");
  });

  test("forma una etiqueta solo con los campos disponibles", () => {
    expect(cityLabel(madrid)).toBe("Madrid, Comunidad de Madrid, España");
    expect(cityLabel(buenosAires)).toBe("Buenos Aires, Argentina");
  });

  test("formatea una fecha ISO válida y conserva una inválida", () => {
    expect(formatDate("2026-10-26")).toBe("lun 26 oct");
    expect(formatDate("2026-02-30")).toBe("2026-02-30");
    expect(formatDate("sin-fecha")).toBe("sin-fecha");
  });
});
