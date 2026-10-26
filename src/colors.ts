// Constantes ANSI crudas, sin dependencias externas.
export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const CYAN = "\x1b[36m";
export const YELLOW = "\x1b[33m";
export const GREEN = "\x1b[32m";
export const RED = "\x1b[31m";

export const cyan = (text: string): string => `${CYAN}${text}${RESET}`;
export const yellow = (text: string): string => `${YELLOW}${text}${RESET}`;
export const green = (text: string): string => `${GREEN}${text}${RESET}`;
export const red = (text: string): string => `${RED}${text}${RESET}`;
export const bold = (text: string): string => `${BOLD}${text}${RESET}`;
