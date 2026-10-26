import { createInterface } from "node:readline/promises";
import type { Interface } from "node:readline/promises";
import { bold, cyan, green, red } from "./colors.ts";
import type { Database } from "./storage.ts";

const SEPARATOR = "═".repeat(40);
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

let reader: Interface | null = null;
let inputClosed = false;
const queuedLines: string[] = [];
const waitingForLines: Array<(line: string) => void> = [];

function getReader(): Interface {
  if (reader) {
    return reader;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  // Lector con buffer: las líneas que llegan sin una pregunta activa quedan en
  // cola para el próximo prompt (así también funciona con input por pipe).
  rl.on("line", (line) => {
    const waiter = waitingForLines.shift();
    if (waiter) {
      waiter(line);
    } else {
      queuedLines.push(line);
    }
  });
  rl.on("close", () => {
    inputClosed = true;
    for (const waiter of waitingForLines.splice(0)) {
      waiter("");
    }
  });
  rl.on("SIGINT", () => {
    closeReader();
    process.exit(0);
  });

  reader = rl;
  return rl;
}

/** Cierra el lector de stdin (necesario antes de salir para que el proceso termine). */
export function closeReader(): void {
  reader?.close();
  reader = null;
}

export function printBanner(): void {
  console.log(cyan(SEPARATOR));
  console.log(cyan(bold("         WEATHER CLI")));
  console.log(cyan(SEPARATOR));
}

export interface MenuItem {
  key: string;
  label: (db: Database) => string;
  run: () => Promise<void>;
  exit?: boolean;
}

export function printMenu(items: MenuItem[], db: Database): void {
  console.log(cyan(SEPARATOR));
  for (const item of items) {
    console.log(`  ${cyan(`${item.key}.`)} ${item.label(db)}`);
  }
  console.log(cyan(SEPARATOR));
}

/** Pregunta por una línea de texto y la devuelve sin espacios sobrantes. */
export async function prompt(message: string): Promise<string> {
  const rl = getReader();
  const queued = queuedLines.shift();
  if (queued === undefined && inputClosed) {
    throw new Error("Se cerró la entrada de datos.");
  }

  // Línea que ya llegaba en cola (pipe sin espera): se muestra junto al prompt.
  if (queued !== undefined) {
    process.stdout.write(`  ${message}${queued}\n`);
    return queued.trim();
  }

  rl.setPrompt(`  ${message}`);
  rl.prompt();
  const line = await new Promise<string>((resolve) => {
    waitingForLines.push(resolve);
  });

  // Sin terminal (pipe) readline no repite lo que se escribió: lo hacemos a mano.
  if (!process.stdin.isTTY) {
    process.stdout.write(`${line}\n`);
  }
  return line.trim();
}

/** Pregunta un número entre 1 y total; repite hasta recibir una opción válida. */
export async function promptIndex(message: string, total: number): Promise<number | null> {
  while (true) {
    const answer = await prompt(message);
    const index = Number(answer) - 1;
    if (Number.isInteger(index) && index >= 0 && index < total) {
      return index;
    }
    printError(`Opción no válida. Ingresa un número entre 1 y ${total}.`);
  }
}

export function printNumbered<T>(items: T[], describe: (item: T) => string): void {
  items.forEach((item, index) => {
    console.log(`  ${cyan(`${index + 1}.`)} ${describe(item)}`);
  });
}

export function printError(message: string): void {
  console.log(red(`  ✖ ${message}`));
}

export function printSuccess(message: string): void {
  console.log(green(`  ✔ ${message}`));
}

/** Muestra un spinner mientras corre la tarea asíncrona y limpia la línea al terminar. */
export async function withLoading<T>(message: string, task: () => Promise<T>): Promise<T> {
  const render = (frame: string): string => `\r\x1b[K  ${cyan(frame)} ${message}`;
  let step = 0;
  process.stdout.write(render(SPINNER_FRAMES[0] ?? "⠋"));

  const timer = setInterval(() => {
    step += 1;
    process.stdout.write(render(SPINNER_FRAMES[step % SPINNER_FRAMES.length] ?? "⠋"));
  }, 80);

  try {
    return await task();
  } finally {
    clearInterval(timer);
    process.stdout.write("\r\x1b[K");
  }
}
