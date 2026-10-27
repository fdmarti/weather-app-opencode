import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { printError, printNumbered, printSuccess, withLoading } from "../../src/presentation/output.ts";

const output: string[] = [];
afterEach(() => {
  output.splice(0);
  mock.restore();
});

describe("output", () => {
  test("imprime mensajes y listas numeradas", () => {
    spyOn(console, "log").mockImplementation((message?: unknown) => { output.push(String(message)); });
    printError("Error");
    printSuccess("Listo");
    printNumbered(["a", "b"], (item) => item.toUpperCase());
    expect(output.join("\n")).toContain("✖ Error");
    expect(output.join("\n")).toContain("✔ Listo");
    expect(output.join("\n")).toContain("1.");
    expect(output.join("\n")).toContain("B");
  });

  test("limpia el spinner al finalizar una tarea", async () => {
    const write = spyOn(process.stdout, "write").mockImplementation(() => true);
    await expect(withLoading("Cargando", async () => 42)).resolves.toBe(42);
    expect(write).toHaveBeenCalledWith("\r\x1b[K");
  });
});
