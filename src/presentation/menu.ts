import type { Database } from "../types/Database.ts";
import type { MenuItem } from "../types/MenuOption.ts";
import { bold, cyan } from "../utils/colors.ts";
import { SEPARATOR } from "../utils/constants.ts";

export function printBanner(): void {
  console.log(cyan(SEPARATOR));
  console.log(cyan(bold("         WEATHER CLI")));
  console.log(cyan(SEPARATOR));
}

export function printMenu(items: MenuItem[], db: Database): void {
  console.log(cyan(SEPARATOR));
  for (const item of items) {
    console.log(`  ${cyan(`${item.key}.`)} ${item.label(db)}`);
  }
  console.log(cyan(SEPARATOR));
}
