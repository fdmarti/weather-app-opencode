import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { BOLD, CYAN, RESET } from "./colors.ts";
import type { Database } from "./storage.ts";

export const LINE = `${CYAN}${"═".repeat(38)}${RESET}`;

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
  console.log(`${CYAN}${BOLD}         WEATHER CLI${RESET}`);
  console.log(LINE);
}

export interface MenuItem {
  key: string;
  label: (db: Database) => string;
  run: (db: Database) => Promise<void>;
  exit?: boolean;
}

export function printMenu(items: MenuItem[], db: Database): void {
  console.log("");
  printBanner();
  for (const item of items) {
    console.log(`  ${CYAN}${item.key}. ${item.label(db)}${RESET}`);
  }
  console.log(LINE);
}

export async function promptNumber(message: string): Promise<number> {
  const answer = await prompt(message);
  const parsed = Number.parseInt(answer, 10);
  return Number.isNaN(parsed) ? -1 : parsed;
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// Muestra un spinner mientras fn() corre. Limpia la línea al terminar y
// propaga cualquier error de fn (el spinner nunca oculta fallos).
export async function withLoading<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let frame = 0;
  stdout.write(`  ${SPINNER_FRAMES[0]} ${label}`);
  const interval = setInterval(() => {
    frame = (frame + 1) % SPINNER_FRAMES.length;
    stdout.write(`\r  ${SPINNER_FRAMES[frame]} ${label}`);
  }, 80);
  try {
    return await fn();
  } finally {
    clearInterval(interval);
    stdout.write("\r\x1b[2K\r");
  }
}

export async function pause(): Promise<void> {
  console.log("");
  await prompt("  Presiona Enter para volver al menú...");
}
