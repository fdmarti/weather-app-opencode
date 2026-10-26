import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import type { Database } from "./storage.ts";

export const LINE = "═".repeat(38);

// Sentinel devuelto por prompt() cuando la entrada terminó (EOF) y ya no hay
// líneas en el buffer; se distingue de un Enter en blanco del usuario.
export const INPUT_ENDED = "␀EOF␀";

// Lector de líneas con buffer: si el usuario (o un pipe) manda varias líneas
// de una vez, no se pierden aunque no haya una pregunta pendiente.
const rl = createInterface({ input: stdin });
const bufferedLines: string[] = [];
const waitingResolvers: Array<(line: string) => void> = [];

rl.on("line", (line) => {
  const resolver = waitingResolvers.shift();
  if (resolver) {
    resolver(line.trim());
  } else {
    bufferedLines.push(line.trim());
  }
});

let inputClosed = false;

rl.on("close", () => {
  inputClosed = true;
  for (const resolver of waitingResolvers.splice(0)) {
    resolver(INPUT_ENDED);
  }
});

export function isInputClosed(): boolean {
  return inputClosed;
}

export function closeInput(): void {
  rl.close();
}

export function prompt(message: string): Promise<string> {
  stdout.write(message);
  const buffered = bufferedLines.shift();
  if (buffered !== undefined) {
    return Promise.resolve(buffered);
  }
  if (inputClosed) {
    return Promise.resolve(INPUT_ENDED);
  }
  return new Promise((resolve) => {
    waitingResolvers.push(resolve);
  });
}

export function printBanner(): void {
  console.log(LINE);
  console.log("         WEATHER CLI");
  console.log(LINE);
}

export function printMenu(db: Database): void {
  console.log("");
  printBanner();
  console.log("  1. Clima de ciudad default");
  console.log(`  2. Clima de todas las ciudades (${db.cities.length})`);
  console.log("  3. Buscar y agregar ciudad");
  console.log("  4. Eliminar ciudad");
  console.log("  5. Establecer ciudad default");
  console.log(`  6. Ajustes (°${db.unit})`);
  console.log("  7. Salir");
  console.log(LINE);
}

export async function promptNumber(message: string): Promise<number> {
  const answer = await prompt(message);
  const parsed = Number.parseInt(answer, 10);
  return Number.isNaN(parsed) ? -1 : parsed;
}

export async function pause(): Promise<void> {
  console.log("");
  await prompt("  Presiona Enter para volver al menú...");
}
