import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import type { Forecast, Hour, Place } from '@/engine/types';

import { CardiWeather } from '../../modules/cardi-weather';

/*
 * Weather comes from Apple Weather (WeatherKit), so Cardi's numbers match the
 * iPhone Weather app. If that isn't available (Expo Go, web, or a WeatherKit
 * error) it falls back to Open-Meteo, whose free tier is fine for testing.
 */
const API = 'https://api.open-meteo.com/v1/forecast';
const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const CACHE_KEY = 'cardi.forecast';
const LAST_PLACE_KEY = 'cardi.lastPlace';
const FRESH_MS = 30 * 60 * 1000;

type OpenMeteo = {
  utc_offset_seconds: number;
  hourly: {
    time: number[];
    temperature_2m: number[];
    apparent_temperature: number[];
    dew_point_2m: number[];
    precipitation_probability: (number | null)[];
    uv_index: (number | null)[];
    wind_speed_10m: number[];
    weather_code: number[];
  };
};

/** WeatherKit conditions mapped to the WMO codes the icons use. */
function wmo(condition: string): number {
  const c = condition.toLowerCase();
  if (c.includes('thunder') || c.includes('storm') || c.includes('hurricane')) return 95;
  if (c.includes('heavysnow') || c.includes('blizzard')) return 75;
  if (c.includes('snow') || c.includes('flurries')) return 71;
  if (c.includes('sleet') || c.includes('freezing') || c.includes('hail') || c.includes('wintry')) return 66;
  if (c.includes('heavyrain')) return 65;
  if (c.includes('rain') || c.includes('showers')) return 61;
  if (c.includes('drizzle')) return 51;
  if (c.includes('fog') || c.includes('haze') || c.includes('smoky')) return 45;
  if (c === 'partlycloudy') return 2;
  if (c.includes('cloud') || c.includes('windy') || c.includes('breezy') || c.includes('blowing')) return 3;
  return 0;
}

async function fromApple(place: Place): Promise<Forecast | null> {
  if (!CardiWeather) return null;
  try {
    const r = await CardiWeather.hourlyAsync(place.lat, place.lon);
    if (!r.hours.length) return null;
    const hours: Hour[] = r.hours.map((h) => ({ t: h.t, temp: h.temp, feels: h.feels, dew: h.dew, rain: h.rain, uv: h.uv, wind: h.wind, code: wmo(h.condition) }));
    return { place: place.name, lat: place.lat, lon: place.lon, utcOffsetSeconds: r.utcOffsetSeconds, fetchedAt: Date.now(), hours, source: 'apple' };
  } catch {
    return null;
  }
}

export async function fetchForecast(place: Place): Promise<Forecast> {
  const apple = await fromApple(place);
  if (apple) {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(apple)).catch(() => {});
    return apple;
  }
  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    hourly: 'temperature_2m,apparent_temperature,dew_point_2m,precipitation_probability,uv_index,wind_speed_10m,weather_code',
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_days: '8',
    wind_speed_unit: 'kmh',
  });
  const res = await fetch(`${API}?${params}`);
  if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
  const j = (await res.json()) as OpenMeteo;
  const h = j.hourly;
  const hours: Hour[] = h.time.map((t, i) => ({
    t: t * 1000,
    temp: h.temperature_2m[i],
    feels: h.apparent_temperature[i],
    dew: h.dew_point_2m[i],
    rain: h.precipitation_probability[i] ?? 0,
    uv: h.uv_index[i] ?? 0,
    wind: h.wind_speed_10m[i],
    code: h.weather_code[i],
  }));
  const f: Forecast = {
    place: place.name,
    lat: place.lat,
    lon: place.lon,
    utcOffsetSeconds: j.utc_offset_seconds,
    fetchedAt: Date.now(),
    hours,
    source: 'open-meteo',
  };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(f)).catch(() => {});
  return f;
}

export async function cachedForecast(): Promise<Forecast | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Forecast) : null;
  } catch {
    return null;
  }
}

export const isFresh = (f: Forecast | null, place: Place | null) =>
  !!f && Date.now() - f.fetchedAt < FRESH_MS && (!place || (Math.abs(f.lat - place.lat) < 0.05 && Math.abs(f.lon - place.lon) < 0.05));

/** The phone's location, named by city. Falls back to the last known place. */
export async function currentPlace(ask: boolean): Promise<Place | null> {
  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted && ask && perm.canAskAgain) perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return lastPlace();
    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const { latitude: lat, longitude: lon } = pos.coords;
    let name = 'Your location';
    try {
      const [g] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      name = g?.city || g?.subregion || g?.region || name;
    } catch {}
    const place = { name, lat, lon };
    await AsyncStorage.setItem(LAST_PLACE_KEY, JSON.stringify(place)).catch(() => {});
    return place;
  } catch {
    return lastPlace();
  }
}

export async function lastPlace(): Promise<Place | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_PLACE_KEY);
    return raw ? (JSON.parse(raw) as Place) : null;
  } catch {
    return null;
  }
}

export async function searchPlaces(q: string): Promise<(Place & { detail: string })[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(`${GEO}?${new URLSearchParams({ name: q.trim(), count: '8', language: 'en', format: 'json' })}`);
  if (!res.ok) return [];
  const j = (await res.json()) as { results?: { name: string; latitude: number; longitude: number; admin1?: string; country?: string }[] };
  return (j.results ?? []).map((r) => ({
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    detail: [r.admin1, r.country].filter(Boolean).join(', '),
  }));
}
