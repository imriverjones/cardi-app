import type { SFSymbol } from 'sf-symbols-typescript';

const DAY = 86_400_000;

/**
 * Dark or light for the icon: sun by day, moon by night. Rough on purpose (no sunrise maths):
 * short days from October to March in the north, and April to September in the south.
 */
export function isNight(dayKey: number, hour: number, lat: number) {
  const month = new Date(dayKey * DAY).getUTCMonth(); // 0 = January
  const winter = month >= 9 || month <= 2;
  const short = lat >= 0 ? winter : !winter;
  return short ? hour < 7 || hour >= 17 : hour < 5 || hour >= 21;
}

/** The weather icon for a WMO condition code, like Apple Weather's. */
export function skySymbol(code: number, night: boolean): SFSymbol {
  if (code === 0 || code === 1) return night ? 'moon.stars.fill' : 'sun.max.fill';
  if (code === 2) return night ? 'cloud.moon.fill' : 'cloud.sun.fill';
  if (code === 3) return 'cloud.fill';
  if (code === 45 || code === 48) return 'cloud.fog.fill';
  if (code >= 51 && code <= 57) return 'cloud.drizzle.fill';
  if (code === 66 || code === 67) return 'cloud.sleet.fill';
  if (code === 65 || code === 82) return 'cloud.heavyrain.fill';
  if ((code >= 61 && code <= 64) || (code >= 80 && code <= 81)) return 'cloud.rain.fill';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'cloud.snow.fill';
  if (code >= 95) return 'cloud.bolt.rain.fill';
  return 'cloud.fill';
}
