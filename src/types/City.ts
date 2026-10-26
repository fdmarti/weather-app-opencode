/** Ciudad devuelta por el geocoding de OpenMeteo. */
export interface GeoCity {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

/** Ciudad guardada en la base de datos local (mismo shape que GeoCity). */
export type City = GeoCity;
