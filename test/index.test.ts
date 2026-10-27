import { describe, expect, test } from "bun:test";
import { database } from "./fixtures/database.ts";
import { createMenuItems } from "../src/index.ts";

describe("createMenuItems", () => {
  test("expone las opciones esperadas con etiquetas dinámicas", () => {
    const items = createMenuItems(database());
    expect(items.map((item) => item.key)).toEqual(["1", "2", "3", "4", "5", "6", "8", "9"]);
    expect(items.find((item) => item.key === "2")?.label(database())).toContain("(1)");
    expect(items.find((item) => item.key === "8")?.label(database({ unit: "F" }))).toBe("Ajustes (°F)");
    expect(items.find((item) => item.key === "9")?.exit).toBe(true);
  });
});
