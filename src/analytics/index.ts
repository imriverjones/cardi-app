import AsyncStorage from '@react-native-async-storage/async-storage';
import { init, trackEvent } from '@aptabase/react-native';

import type { Settings } from '@/engine/types';

import { CardiNative } from '../../modules/cardi-native';

/*
 * Anonymous usage numbers with Aptabase: no names, emails, locations or device IDs.
 * Paste the App Key from aptabase.com (Instructions, in the left menu) below.
 * While it's empty nothing is sent.
 */
const APTABASE_KEY = 'A-EU-4751170108';

let started = false;

export function startAnalytics() {
  if (started || !APTABASE_KEY) return;
  try {
    init(APTABASE_KEY);
    started = true;
  } catch {}
}

type Props = Record<string, string | number | boolean>;

export function track(event: string, props?: Props) {
  if (!started) return;
  try {
    trackEvent(event, props);
  } catch {}
}

const DAILY_KEY = 'cardi.analytics.daily';

/**
 * Once a day: which widgets are on screen and which features are on.
 * This is how you see how many people have the widget, not just the app.
 */
export async function trackDaily(s: Settings) {
  if (!started || !s.onboarded) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    if ((await AsyncStorage.getItem(DAILY_KEY)) === today) return;
    await AsyncStorage.setItem(DAILY_KEY, today);
    const widgets = CardiNative ? await CardiNative.widgetsAsync().catch(() => [] as string[]) : [];
    const families = widgets.map((w) => w.split(':')[1] ?? w);
    track('daily', {
      widgets: widgets.length,
      lockScreen: families.some((f) => f.startsWith('accessory')),
      homeScreen: families.some((f) => f.startsWith('system')),
      checkIn: widgets.some((w) => w.startsWith('CheckInWidget')),
      families: [...new Set(families)].sort().join(',') || 'none',
      notify: s.notify,
      look: s.skin,
      wear: s.wear,
      hair: s.cover.hair ? s.hair : 'off',
      commute: s.cover.commute ? s.move : 'off',
      kids: s.cover.kids,
      washing: s.cover.washing,
      bias: s.bias,
    });
  } catch {}
}
