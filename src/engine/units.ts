import type { Settings } from './types';

/**
 * The engine thinks in °C and km/h. These turn numbers into what the person reads,
 * in °F or mph if that's what they use. Set once from settings (setUnits) before rendering,
 * syncing widgets or scheduling notifications.
 */
let tempUnit: 'c' | 'f' = 'c';
let speedUnit: 'kmh' | 'mph' = 'kmh';

/** What the phone's region uses, e.g. the UK is °C and mph, the US is °F and mph. */
export function deviceUnits(): { temp: 'c' | 'f'; speed: 'kmh' | 'mph' } {
  try {
    // Loaded lazily so the engine still runs in plain Node for tests.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const [locale] = require('expo-localization').getLocales();
    return {
      temp: locale?.temperatureUnit === 'fahrenheit' ? 'f' : 'c',
      speed: locale?.measurementSystem === 'us' || locale?.measurementSystem === 'uk' ? 'mph' : 'kmh',
    };
  } catch {
    return { temp: 'c', speed: 'kmh' };
  }
}

export function resolvedUnits(s: Pick<Settings, 'temp' | 'speed'>) {
  const d = deviceUnits();
  return { temp: s.temp === 'auto' || !s.temp ? d.temp : s.temp, speed: s.speed === 'auto' || !s.speed ? d.speed : s.speed };
}

export function setUnits(s: Pick<Settings, 'temp' | 'speed'>) {
  const u = resolvedUnits(s);
  tempUnit = u.temp;
  speedUnit = u.speed;
}

/** A temperature as a whole number in the person's unit: 9 → 9 or 48. */
export const deg = (c: number) => Math.round(tempUnit === 'f' ? (c * 9) / 5 + 32 : c);
/** "9°" or "48°" */
export const t = (c: number) => `${deg(c)}°`;
/** "9–14°" */
export const tRange = (lo: number, hi: number) => `${deg(lo)}–${deg(hi)}°`;
/** "24 km/h" or "15 mph" */
export const wind = (kmh: number) => (speedUnit === 'mph' ? `${Math.round(kmh * 0.621)} mph` : `${Math.round(kmh)} km/h`);
/** A temperature difference: 4°C reads as about 7°F. */
export const tDelta = (c: number) => `${Math.round(tempUnit === 'f' ? (c * 9) / 5 : c)}°`;
