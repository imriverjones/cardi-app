import type { SFSymbol } from 'sf-symbols-typescript';

import { advise, fmtClock, fmtHour, localDayKey, timeAt, type Advice } from '@/engine/advice';
import type { Forecast, Settings } from '@/engine/types';

import type { CardiWidgetProps, Tone } from './CardiWidget';

const OUTFIT_SYMBOL: Record<Advice['step']['art'], SFSymbol> = {
  coat: 'coat.fill',
  jacket: 'jacket.fill',
  knit: 'tshirt.fill',
  tee: 'tshirt.fill',
};

function bringIcons(a: Advice, s: Settings): SFSymbol[] {
  const icons: SFSymbol[] = [];
  if (a.brolly) icons.push('umbrella.fill');
  if (s.cover.skin && a.uv >= 3) icons.push(a.uv >= 6 ? 'sunglasses.fill' : 'sun.max.fill');
  if (s.cover.hair && a.frizz >= 4 && a.curly) icons.push('humidity.fill');
  if (icons.length < 3 && a.windy) icons.push('wind');
  if (!icons.length) icons.push(a.step.art === 'tee' ? 'sun.max.fill' : 'checkmark');
  return icons.slice(0, 3);
}

function lines(a: Advice, s: Settings, mode: CardiWidgetProps['mode']) {
  const out: { tone: Tone; text: string }[] = [];
  if (mode === 'home') {
    out.push(a.brolly ? { tone: 'rain', text: `Rain from ${fmtHour(a.rainStart ?? s.back)}` } : { tone: 'rain', text: 'Dry on the way home' });
    out.push({ tone: 'layer', text: `Feels ${a.homeFeels}° for you` });
  } else {
    if (a.brolly) out.push({ tone: 'rain', text: `Brolly for ${fmtHour(a.rainStart ?? s.back)}` });
    if (s.cover.hair && s.hair !== 'short') out.push({ tone: 'hair', text: a.hair.label });
    if (s.cover.skin && a.uv >= 3) out.push({ tone: 'sun', text: `UV ${a.uv}, SPF ${a.uv >= 6 ? 'and shades' : 'at lunch'}` });
    if (a.warmUp) out.push({ tone: 'layer', text: `${a.lunch}° by lunch, wear layers` });
  }
  if (s.cover.commute) out.push({ tone: 'other', text: a.commute.s });
  if (s.cover.washing) out.push({ tone: 'green', text: a.washing.s });
  if (!out.length) out.push({ tone: 'other', text: `${a.lo}° to ${a.hi}° today` });
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
    mode === 'morning' ? `${s.name ? `Morning, ${s.name}` : 'Today'} · ${a.place}` : mode === 'home' ? 'Heading home' : `Tomorrow, ${fmtClock(s.leave)}`;
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
  const inlineParts = [`${feels}° for you`, a.step.short];
  if (a.brolly) inlineParts.push(`Rain ${fmtHour(a.rainStart ?? s.back)}`);
  return {
    skin: s.skin,
    mode,
    label,
    feels,
    lo: a.lo,
    hi: a.hi,
    verdict,
    headline,
    headline2,
    lines: lines(a, s, mode),
    icons: bringIcons(a, s),
    outfitSymbol: OUTFIT_SYMBOL[a.step.art],
    tiles: tiles(a, s),
    inline: inlineParts.join(' · '),
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
