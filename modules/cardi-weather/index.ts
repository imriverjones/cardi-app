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

type CardiWeatherNative = {
  hourlyAsync(lat: number, lon: number): Promise<{ utcOffsetSeconds: number; hours: AppleHour[] }>;
  attributionAsync(): Promise<AppleAttribution>;
};

/** null in Expo Go, on web and on Android, where Apple Weather isn't available. */
export const CardiWeather = requireOptionalNativeModule<CardiWeatherNative>('CardiWeather');
