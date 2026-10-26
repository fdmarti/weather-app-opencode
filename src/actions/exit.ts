import { closeReader } from "../presentation/input.ts";
import { bold } from "../utils/colors.ts";

/** Opción 9: cierra la aplicación. */
export async function exitApp(): Promise<void> {
  closeReader();
  console.log(`\n  ${bold("¡Hasta luego!")}\n`);
}
