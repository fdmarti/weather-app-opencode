import { describe, expect, test } from "bun:test";
import { buenosAires, madrid } from "../fixtures/cities.ts";
import { sameCity } from "../../src/utils/city.ts";

describe("sameCity", () => {
  test("identifica una ciudad por sus coordenadas", () => {
    expect(sameCity(madrid, { ...madrid, name: "Otro nombre" })).toBe(true);
    expect(sameCity(madrid, buenosAires)).toBe(false);
  });
});
