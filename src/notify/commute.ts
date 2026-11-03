import { advise, forDay, isWorkDay, localDayKey, timeAt } from '@/engine/advice';
import type { Forecast, Settings } from '@/engine/types';
import { commuteTip } from '@/widgets/sync';

import type { Nudge } from './wet';

/** Three evenings ahead is as far as the hourly forecast is worth trusting. */
const DAYS_AHEAD = 3;

const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/**
 * The evening before a work day: "Tomorrow: walk in, train home", with the weather behind it.
 * Sent at your "widget shows tomorrow from" time, so the Lock Screen and the notification agree.
 * Pure, so it can be tested without a phone.
 */
export function commuteNudges(f: Forecast, s: Settings, now = Date.now()): Nudge[] {
  if (!s.cover.commute) return [];
  const today = localDayKey(f, now);
  const out: Nudge[] = [];
  for (let day = today + 1; day <= today + DAYS_AHEAD; day++) {
    if (!isWorkDay(s, day)) continue;
    const a = advise(f, s, day);
    const tip = a && commuteTip(a);
    if (!tip) continue;
    const at = timeAt(f, day - 1, Math.min(23.5, Math.max(s.tomorrowAt ?? 20, forDay(s, day - 1).back + 0.5)));
    if (at <= now + 60_000) continue;
    out.push({ at, title: `Tomorrow: ${lower(tip.text)}`, body: `${tip.sub}${tip.swap ? ' Plan changed for the weather.' : ''}` });
  }
  return out;
}
