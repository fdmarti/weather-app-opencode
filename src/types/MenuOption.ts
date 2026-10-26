import type { Database } from "./Database.ts";

/** Opción del menú principal: tecla, etiqueta dinámica y acción a ejecutar. */
export interface MenuItem {
  key: string;
  label: (db: Database) => string;
  run: () => Promise<void>;
  exit?: boolean;
}
