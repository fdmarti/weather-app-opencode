import { describe, expect, mock, test } from "bun:test";
import { database } from "../fixtures/database.ts";
import { toggleUnit } from "../../src/actions/toggleUnit.ts";

describe("toggleUnit", () => {
  test("alterna la unidad, persiste e informa el resultado", async () => {
    const db = database({ unit: "C" });
    const saveDatabase = mock(() => undefined);
    const printSuccess = mock(() => undefined);

    await toggleUnit(db, { saveDatabase, printSuccess });

    expect(db.unit).toBe("F");
    expect(saveDatabase).toHaveBeenCalledWith(db);
    expect(printSuccess).toHaveBeenCalledWith("Unidad de temperatura: °F");
  });
});
