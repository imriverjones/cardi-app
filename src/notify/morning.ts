import * as Notifications from 'expo-notifications';

import { advise, isWorkDay, localDayKey, timeAt, type Advice } from '@/engine/advice';
import type { Forecast, Settings } from '@/engine/types';
import { setUnits, t, tRange } from '@/engine/units';
import { alerts } from '@/widgets/sync';

import { wetNudges } from './wet';

/** How many mornings ahead to schedule. The forecast covers 8 days; the background refresh keeps them up to date. */
const DAYS_AHEAD = 7;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** The morning message: "Feels 9–17° · Jacket day" and the two things worth acting on, same as the widget. */
export function morningMessage(a: Advice, s: Settings) {
  const range = a.peak - a.mine >= 4 ? tRange(a.mine, a.peak) : t(a.mine);
  const lines = alerts(a, s, 'morning')
    .slice(0, 2)
    .map((x) => `${x.text}.`);
  return { title: `Feels ${range} · ${a.step.day}`, body: lines.join(' ') };
}

/** Ask once. Returns whether notifications are allowed. */
export async function askToNotify() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const r = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
    return r.granted;
  } catch {
    return false;
  }
}

/** Replace the scheduled mornings with fresh ones from this forecast. Safe to call anywhere. */
export async function scheduleMornings(f: Forecast, s: Settings, now = Date.now()) {
  setUnits(s);
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!s.onboarded || (!s.notify && !s.rainAlerts)) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    // Rain or snow on the way: 30 minutes before, if it matters to you.
    if (s.rainAlerts)
      for (const n of wetNudges(f, s, now))
        await Notifications.scheduleNotificationAsync({
          content: { title: n.title, body: n.body, data: { url: 'cardi://?from=notification' } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(n.at) },
        });
    if (!s.notify) return;
    const today = localDayKey(f, now);
    for (let d = 0; d < DAYS_AHEAD; d++) {
      // No alarm-clock heads-up on a day off: it waits until 9am at the earliest.
      const at = timeAt(f, today + d, isWorkDay(s, today + d) ? s.notifyAt : Math.max(s.notifyAt, 9));
      if (at <= now + 60_000) continue;
      const a = advise(f, s, today + d);
      if (!a) continue;
      await Notifications.scheduleNotificationAsync({
        content: { ...morningMessage(a, s), data: { url: 'cardi://?from=notification' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
      });
    }
  } catch {
    // Not available on web or in some test builds. Nothing to do.
  }
}
