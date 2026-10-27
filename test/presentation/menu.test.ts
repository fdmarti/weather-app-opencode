import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { database } from "../fixtures/database.ts";
import type { MenuItem } from "../../src/types/MenuOption.ts";
import { printBanner, printMenu } from "../../src/presentation/menu.ts";

const output: string[] = [];
afterEach(() => {
  output.splice(0);
  mock.restore();
});

describe("menu", () => {
  test("imprime el banner y las opciones", () => {
    spyOn(console, "log").mockImplementation((message?: unknown) => { output.push(String(message)); });
    const items: MenuItem[] = [{ key: "1", label: () => "Clima", run: async () => undefined }];
    printBanner();
    printMenu(items, database());
    expect(output).toHaveLength(6);
    expect(output.join("\n")).toContain("WEATHER CLI");
    expect(output.join("\n")).toContain("1.");
    expect(output.join("\n")).toContain("Clima");
  });
});
