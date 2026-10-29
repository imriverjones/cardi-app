import { fmtHour, forDay, hoursForDay, isSnow, isWorkDay, localDayKey, timeAt, wetChance } from '@/engine/advice';
import type { Forecast, Settings } from '@/engine/types';

export type Nudge = { at: number; title: string; body: string };

/** Three days is as far as an hourly forecast is worth nagging about. */
const DAYS_AHEAD = 3;
const MAX_PER_DAY = 2;
/** Rain or snow this likely is worth a buzz; less is just a cloudy day. */
const LIKELY = 50;

/**
 * A heads-up 30 minutes before rain or snow reaches you.
 * Work days: when it lands on your trip out or your trip home.
 * Days off: when a wet spell starts while you might be out (10am to 7pm).
 * Pure, so it can be tested without a phone. morning.ts schedules what this returns.
 */
export function wetNudges(f: Forecast, s: Settings, now = Date.now()): Nudge[] {
  const out: Nudge[] = [];
  const today = localDayKey(f, now);
  for (let k = 0; k < DAYS_AHEAD; k++) {
    const day = today + k;
    const d = hoursForDay(f, day);
    if (d.length < 24) continue;
    const ds = forDay(s, day);
    const found: Nudge[] = [];

    const say = (hours: number[], atHour: number, when: string) => {
      // The morning heads-up already covers a trip that starts within 45 minutes of it.
      if (s.notify && isWorkDay(s, day) && Math.abs(atHour - s.notifyAt) < 0.75) return;
      const worst = hours.reduce((a, b) => (wetChance(d[b]) > wetChance(d[a]) ? b : a), hours[0]);
      const snow = isSnow(d[worst]);
      found.push({
        at: timeAt(f, day, atHour),
        title: `${snow ? 'Snow' : 'Rain'} ${when}`,
        body: `${snow ? 'Boots, not trainers' : 'Take a brolly'}. ${wetChance(d[worst])}% chance.`,
      });
    };

    if (isWorkDay(s, day)) {
      (
        [
          [ds.leave, 'on the way out'],
          [ds.back, 'on the way home'],
        ] as const
      ).forEach(([trip, when]) => {
        const hours: number[] = [];
        for (let h = Math.floor(trip); h <= Math.min(23, Math.ceil(trip + 1)); h++) hours.push(h);
        if (Math.max(...hours.map((h) => wetChance(d[h]))) >= LIKELY) say(hours, trip - 0.5, when);
      });
    } else {
      for (let h = 10; h <= 19; h++) if (wetChance(d[h]) >= LIKELY && wetChance(d[h - 1]) < LIKELY - 10) say([h], h - 0.5, `from ${fmtHour(h)}`);
    }
    out.push(...found.slice(0, MAX_PER_DAY));
  }
  return out.filter((n) => n.at > now + 60_000).sort((a, b) => a.at - b.at);
}
