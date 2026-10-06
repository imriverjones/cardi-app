import { requireOptionalNativeModule } from 'expo';

export type AppleHour = {
  t: number;
  temp: number;
  feels: number;
  dew: number;
  rain: number;
  uv: number;
  wind: number;
  /** WeatherKit condition, e.g. "clear", "rain", "partlyCloudy" */
  condition: string;
};

export type AppleAttribution = { legalPageURL: string; markLightURL: string; markDarkURL: string; serviceName: string };

export type ApplePlace = { name: string; detail: string; lat: number; lon: number };

type CardiNativeModule = {
  hourlyAsync(lat: number, lon: number): Promise<{ utcOffsetSeconds: number; hours: AppleHour[] }>;
  attributionAsync(): Promise<AppleAttribution>;
  searchPlacesAsync(query: string): Promise<ApplePlace[]>;
  /** Installed widgets as "kind:family", e.g. "CardiWidget:accessoryRectangular" */
  widgetsAsync(): Promise<string[]>;
};

/** null in Expo Go, on web and on Android. Every caller has a fallback. */
export const CardiNative = requireOptionalNativeModule<CardiNativeModule>('CardiNative');
