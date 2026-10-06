import type { SFSymbol } from 'sf-symbols-typescript';

import { advise, fmtClock, fmtHour, localDayKey, timeAt, type Advice } from '@/engine/advice';
import type { Forecast, Settings } from '@/engine/types';

import type { CardiWidgetProps } from './CardiWidget';

export const OUTFIT_SYMBOL: Record<Advice['step']['art'], SFSymbol> = {
  coat: 'coat.fill',
  jacket: 'jacket.fill',
  knit: 'tshirt.fill',
  tee: 'tshirt.fill',
};

type Alert = CardiWidgetProps['alerts'][number];

const MOVE_SYMBOL: Record<Settings['move'], SFSymbol> = { walk: 'figure.walk', cycle: 'bicycle', transit: 'tram.fill' };
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * The things worth acting on, most important first. The Lock Screen shows the top two,
 * so each one is a few words someone can take in at a glance.
 */
export function alerts(a: Advice, s: Settings, mode: CardiWidgetProps['mode']): Alert[] {
  const out: Alert[] = [];
  const rainAt = fmtHour(a.rainStart ?? s.back);
  if (mode === 'home') {
    out.push(a.rHome >= 40 ? { symbol: 'umbrella.fill', tone: 'rain', text: `Brolly · rain ${rainAt}` } : { symbol: 'checkmark.circle.fill', tone: 'green', text: 'Dry way home' });
  } else {
    if (a.brolly) out.push({ symbol: 'umbrella.fill', tone: 'rain', text: `Brolly · rain ${rainAt}` });
    if (a.warmUp) out.push({ symbol: 'arrow.up.right', tone: 'layer', text: `Layers · ${a.lunch}° by lunch` });
    if (s.cover.skin && a.uv >= 3) out.push({ symbol: 'sun.max.fill', tone: 'sun', text: `SPF · UV ${a.uv} at ${fmtHour(a.uvPeak)}` });
    if (s.cover.hair && s.hair !== 'short' && a.frizz >= 4) out.push({ symbol: 'humidity.fill', tone: 'hair', text: cap(a.hair.short) });
  }
  if (a.windy) out.push({ symbol: 'wind', tone: 'other', text: `Windy · ${a.maxWind} km/h` });
  if (s.cover.commute) out.push({ symbol: MOVE_SYMBOL[s.move], tone: 'other', text: a.commute.s });
  if (s.cover.washing) out.push({ symbol: 'hanger', tone: 'green', text: a.washing.s });
  if (!out.length) out.push({ symbol: 'checkmark.circle.fill', tone: 'green', text: a.rOut < 40 && a.rHome < 40 ? 'Dry · nothing to carry' : 'Nothing to carry' });
  return out.slice(0, 3);
}

function tiles(a: Advice, s: Settings): CardiWidgetProps['tiles'] {
  const t: CardiWidgetProps['tiles'] = [
    { tone: 'other', title: `${fmtClock(s.leave)} · out`, value: `${a.leaveFeels}° · ${a.rOut >= 40 ? 'rain' : 'dry'}` },
    { tone: 'rain', title: `${fmtClock(s.back)} · home`, value: `${a.homeFeels}° · ${a.rHome >= 40 ? `rain ${a.rHome}%` : 'dry'}` },
  ];
  if (s.cover.hair && s.hair !== 'short') t.push({ tone: 'hair', title: 'Hair', value: a.hair.label });
  if (s.cover.skin) t.push({ tone: 'sun', title: `UV ${a.uv}`, value: a.uv <= 2 ? 'No SPF needed' : a.uv <= 5 ? 'SPF at lunch' : 'SPF and shades' });
  if (s.cover.washing) t.push({ tone: 'green', title: 'Washing', value: a.washing.s });
  if (s.cover.commute) t.push({ tone: 'layer', title: 'Commute', value: a.commute.s });
  while (t.length < 4) t.push({ tone: 'layer', title: 'Range', value: `${a.lo}° to ${a.hi}°` });
  return t.slice(0, 4);
}

function entry(a: Advice, s: Settings, mode: CardiWidgetProps['mode']): CardiWidgetProps {
  const feels = mode === 'home' ? a.homeFeels : a.mine;
  const verdict = mode === 'home' ? (a.brolly ? 'Brolly out' : a.step.day) : a.step.day;
  const label =
    mode === 'morning' ? 'Feels like for you' : mode === 'home' ? `Heading home, ${fmtClock(s.back)}` : `Tomorrow, ${fmtClock(s.leave)}`;
  const headline = mode === 'home' ? (a.brolly ? `Rain at ${fmtHour(a.rainStart ?? s.back)}.` : 'Dry way home.') : `${a.step.day}.`;
  const headline2 =
    mode === 'home'
      ? a.brolly
        ? 'Brolly out.'
        : `Feels ${a.homeFeels}°.`
      : a.brolly
        ? 'Brolly later.'
        : s.cover.hair && a.frizz >= 7 && a.curly
          ? 'Hair up.'
          : s.cover.hair && a.frizz <= 3
            ? 'Hair down.'
            : a.uv >= 6
              ? 'SPF on.'
              : 'Dry all day.';
  const al = alerts(a, s, mode);
  // Above the clock: "Feels 7° · Jacket · Rain 5:30"
  const rain = mode === 'home' ? a.rHome >= 40 : a.brolly;
  const inline = `Feels ${feels}° · ${a.step.short}` + (rain ? ` · Rain ${fmtHour(a.rainStart ?? s.back)}` : '');
  const inlineSymbol: SFSymbol = rain ? 'umbrella.fill' : OUTFIT_SYMBOL[a.step.art];
  return {
    skin: s.skin,
    mode,
    label,
    feels,
    actual: mode === 'home' ? a.homeTemp : a.actual,
    when: mode === 'home' || a.when === 'home' ? 'way home' : 'way out',
    lo: a.lo,
    hi: a.hi,
    verdict,
    headline,
    headline2,
    alerts: al,
    short: a.step.short,
    outfitSymbol: OUTFIT_SYMBOL[a.step.art],
    tiles: tiles(a, s),
    inline,
    inlineSymbol,
    frizz: s.cover.hair ? a.frizz : -1,
    hairLabel: a.hair.label,
  };
}

/**
 * The widget shows the right moment of the day without the app running:
 * the morning view, then the trip home from 2 hours before you leave work,
 * then tomorrow's outfit from an hour after you get home.
 */
export function buildTimeline(f: Forecast, s: Settings, now = Date.now()) {
  const today = localDayKey(f, now);
  const a0 = advise(f, s, today);
  const a1 = advise(f, s, today + 1);
  const out: { date: Date; props: CardiWidgetProps }[] = [];
  const homeFrom = timeAt(f, today, Math.max(s.leave + 1, s.back - 2));
  const tomorrowFrom = timeAt(f, today, Math.min(23.5, s.back + 1.5));

  if (a0 && now < homeFrom) out.push({ date: new Date(now), props: entry(a0, s, 'morning') });
  if (a0 && now < tomorrowFrom) out.push({ date: new Date(Math.max(now, homeFrom)), props: entry(a0, s, 'home') });
  if (a1) out.push({ date: new Date(Math.max(now, tomorrowFrom)), props: entry(a1, s, 'tomorrow') });
  // Tomorrow's morning view and trip home, so the widget keeps going if the app isn't opened.
  if (a1) {
    out.push({ date: new Date(timeAt(f, today + 1, 4)), props: entry(a1, s, 'morning') });
    out.push({ date: new Date(timeAt(f, today + 1, Math.max(s.leave + 1, s.back - 2))), props: entry(a1, s, 'home') });
  }
  return out.filter((e, i, arr) => i === 0 || e.date.getTime() > arr[i - 1].date.getTime());
}

/** Push the latest advice to the Home and Lock Screen widgets. Safe to call anywhere. */
export async function syncWidgets(f: Forecast, s: Settings) {
  try {
    const { default: CardiWidget } = await import('./CardiWidget');
    const timeline = buildTimeline(f, s);
    if (timeline.length) CardiWidget.updateTimeline(timeline);
  } catch {
    // Widgets aren't available (web, Android or Expo Go). Nothing to do.
  }
}

export async function syncCheckInSkin(s: Settings) {
  try {
    const { default: CheckInWidget } = await import('./CheckInWidget');
    CheckInWidget.updateSnapshot({ skin: s.skin });
  } catch {}
}

/** If the check-in widget was answered since we last looked, return the answer once. */
export async function takeCheckInAnswer(): Promise<'cold' | 'ok' | 'warm' | null> {
  try {
    const { default: CheckInWidget } = await import('./CheckInWidget');
    const tl = await CheckInWidget.getTimeline();
    const last = tl[tl.length - 1]?.props;
    if (last?.answer) {
      CheckInWidget.updateSnapshot({ skin: last.skin });
      return last.answer;
    }
  } catch {}
  return null;
}
