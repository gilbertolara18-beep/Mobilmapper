export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface UTMCoordinates {
  easting: number;
  northing: number;
  zone: number;
  band: string;
}

export interface GeoPoint {
  id: string;
  name: string;
  type: string;
  characteristics: string;
  observations: string;
  timestamp: number;
  coords: Coordinates;
  utm: UTMCoordinates;
  photoBase64?: string;
}

export enum ViewState {
  MAP = 'MAP',
  LIST = 'LIST',
  FORM = 'FORM',
  DETAILS = 'DETAILS'
}

export const POINT_TYPES = [
  "Infraestructura",
  "Vegetación",
  "Hidrografía",
  "Punto de Control",
  "Inundación",
  "Hundimiento",
  "Subsidencia",
  "Agrietamiento",
  "Desbordamiento",
  "Deslave",
  "Otro"
];