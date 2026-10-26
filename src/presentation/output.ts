import { cyan, green, red } from "../utils/colors.ts";
import { SPINNER_FRAMES } from "../utils/constants.ts";

export function printError(message: string): void {
  console.log(red(`  ✖ ${message}`));
}

export function printSuccess(message: string): void {
  console.log(green(`  ✔ ${message}`));
}

export function printNumbered<T>(items: T[], describe: (item: T) => string): void {
  items.forEach((item, index) => {
    console.log(`  ${cyan(`${index + 1}.`)} ${describe(item)}`);
  });
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
