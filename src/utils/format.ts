import type { City } from "../types/City.ts";
import type { Unit } from "../types/Database.ts";

const DIAS_SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatTemperature(value: number, unit: Unit): string {
  return `${value.toFixed(1)}°${unit}`;
}

export function cityLabel(city: City): string {
  const parts = [city.name, city.admin1, city.country].filter((part): part is string => Boolean(part));
  return parts.join(", ");
}

/** Convierte "2026-10-26" a "lun 26 oct"; devuelve la fecha cruda si no es válida. */
export function formatDate(isoDate: string): string {
  const parts = isoDate.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (parts.length !== 3 || !Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return isoDate;
  }

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime()) || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return isoDate;
  }

  const weekday = DIAS_SEMANA[date.getDay()] ?? "";
  const monthName = MESES[date.getMonth()] ?? "";
  return `${weekday} ${day} ${monthName}`;
}
