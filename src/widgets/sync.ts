import type { SFSymbol } from 'sf-symbols-typescript';

import { advise, fmtClock, fmtHour, forDay, isWorkDay, localDayKey, localHourOf, timeAt, type Advice } from '@/engine/advice';
import type { Forecast, Settings } from '@/engine/types';
import { deg, setUnits, t as tStr, wind } from '@/engine/units';

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
export function alerts(a: Advice, settings: Settings, mode: CardiWidgetProps['mode']): Alert[] {
  const s = forDay(settings, a.dayKey);
  const out: Alert[] = [];
  const rainAt = fmtHour(a.rainStart ?? s.back);
  // Rain or snow in the next few hours comes first: it's the thing you can still do something about.
  const nw = a.nextWet;
  if (nw)
    out.push({
      symbol: nw.snow ? 'snowflake' : 'cloud.rain.fill',
      tone: 'rain',
      text: nw.now ? (nw.snow ? 'Snowing now' : 'Raining now') : `${nw.snow ? 'Snow' : 'Rain'} from ${fmtHour(nw.h)}`,
      sub: `${nw.pct}% chance${nw.snow ? '. Boots, not trainers' : ''}`,
    });
  // Brolly, or boots when it's snow.
  const kit = (snow: boolean) => (snow ? 'Boots' : 'Brolly');
  const wetSym = (snow: boolean): SFSymbol => (snow ? 'snowflake' : 'umbrella.fill');
  if (a.off) {
    // A day off: no trips to talk about, just whether you'll want a brolly or a layer while you're out.
    if (a.brolly && !nw)
      out.push({ symbol: wetSym(a.snowy), tone: 'rain', text: `${kit(a.snowy)} · ${a.snowy ? 'snow' : 'rain'} from ${rainAt}`, sub: `${a.rOut}% chance if you're out and about` });
    if (a.warmUp) out.push({ symbol: 'arrow.up.right', tone: 'layer', text: `Warms to ${tStr(a.peak)} by ${fmtHour(a.peakHour)}`, sub: "You won't need the coat later" });
    else if (a.cools)
      out.push({ symbol: 'arrow.down.right', tone: 'layer', text: `Cools to ${tStr(a.homeFeels)} by ${fmtClock(s.back)}`, sub: "Take a coat if you're out late" });
    if (s.cover.skin && a.uv >= 3)
      out.push({ symbol: 'sun.max.fill', tone: 'sun', text: `SPF · UV ${a.uv} at ${fmtHour(a.uvPeak)}`, sub: a.uv >= 6 ? 'SPF 30+ and sunglasses' : 'Stronger than it feels on a cool day' });
    if (s.cover.hair && s.hair !== 'short' && a.frizz >= 4) out.push({ symbol: 'humidity.fill', tone: 'hair', text: cap(a.hair.short), sub: a.hair.tip });
  } else if (mode === 'home') {
    out.push(
      a.rHome >= 40
        ? { symbol: wetSym(a.snowHome), tone: 'rain', text: `${kit(a.snowHome)} for the way home`, sub: `${a.rHome}% chance of ${a.snowHome ? 'snow' : 'rain'} around ${fmtClock(s.back)}` }
        : { symbol: 'checkmark.circle.fill', tone: 'green', text: 'Dry way home', sub: 'No brolly needed' }
    );
    if (a.cools)
      out.push({ symbol: 'arrow.down.right', tone: 'layer', text: `Cools to ${tStr(a.homeFeels)} by ${fmtClock(s.back)}`, sub: 'Coat back on for the way home' });
  } else {
    // Rain or snow, said in terms of your trips: in, home, both, or only while you're out and about.
    const snow = a.snowOut || a.snowHome;
    if (a.rOut >= 40 && a.rHome >= 40)
      out.push({ symbol: wetSym(snow), tone: 'rain', text: `${kit(snow)} both ways`, sub: `${snow ? 'Snow' : 'Rain'} on the way in and home, from ${rainAt}` });
    else if (a.rHome >= 40)
      out.push({ symbol: wetSym(a.snowHome), tone: 'rain', text: `${kit(a.snowHome)} for the way home`, sub: `Dry on the way in, ${a.snowHome ? 'snow' : 'rain'} from ${rainAt}` });
    else if (a.rOut >= 40)
      out.push({ symbol: wetSym(a.snowOut), tone: 'rain', text: `${kit(a.snowOut)} for the way in`, sub: `${a.snowOut ? 'Snow' : 'Rain'} around ${fmtClock(s.leave)}, dry later` });
    else if (a.midRain && !nw)
      out.push({
        symbol: a.snowy ? 'snowflake' : 'cloud.rain.fill',
        tone: 'rain',
        text: `${a.snowy ? 'Snow' : 'Showers'} ${fmtHour(a.midRain[0])}–${fmtHour(a.midRain[1])}`,
        sub: 'Dry on your trips. A brolly in your bag for lunch',
      });
    // How the day changes, so a cold morning doesn't leave you too warm by 2pm (and the reverse).
    if (a.warmUp) out.push({ symbol: 'arrow.up.right', tone: 'layer', text: `Warms to ${tStr(a.peak)} by ${fmtHour(a.peakHour)}`, sub: "You won't need the coat later" });
    else if (a.cools)
      out.push({ symbol: 'arrow.down.right', tone: 'layer', text: `Cools to ${tStr(a.homeFeels)} by ${fmtClock(s.back)}`, sub: 'Bring the coat for the way home' });
    if (s.cover.skin && a.uv >= 3)
      out.push({ symbol: 'sun.max.fill', tone: 'sun', text: `SPF · UV ${a.uv} at ${fmtHour(a.uvPeak)}`, sub: a.uv >= 6 ? 'SPF 30+ and sunglasses' : 'Stronger than it feels on a cool day' });
    if (s.cover.hair && s.hair !== 'short' && a.frizz >= 4) out.push({ symbol: 'humidity.fill', tone: 'hair', text: cap(a.hair.short), sub: a.hair.tip });
  }
  if (a.windy) out.push({ symbol: 'wind', tone: 'other', text: `Windy · ${wind(a.maxWind)}`, sub: 'Zip up, and hold on to your hat' });
  if (s.cover.commute) out.push({ symbol: MOVE_SYMBOL[s.move], tone: 'other', text: a.commute.s, sub: a.commute.m });
  if (s.cover.washing) out.push({ symbol: 'hanger', tone: 'green', text: a.washing.s, sub: a.washing.m });
  if (!out.length)
    out.push({ symbol: 'checkmark.circle.fill', tone: 'green', text: a.rOut < 40 && a.rHome < 40 ? 'Dry · nothing to carry' : 'Nothing to carry', sub: 'Nothing else to think about today' });
  return out.slice(0, 3);
}

function tiles(a: Advice, s: Settings): CardiWidgetProps['tiles'] {
  const t: CardiWidgetProps['tiles'] = [
    { tone: 'other', title: `${fmtClock(s.leave)} · out`, value: `${tStr(a.leaveFeels)} · ${a.rOut >= 40 ? 'rain' : 'dry'}` },
    { tone: 'rain', title: `${fmtClock(s.back)} · home`, value: `${tStr(a.homeFeels)} · ${a.rHome >= 40 ? `rain ${a.rHome}%` : 'dry'}` },
  ];
  if (s.cover.hair && s.hair !== 'short') t.push({ tone: 'hair', title: 'Hair', value: a.hair.label });
  if (s.cover.skin) t.push({ tone: 'sun', title: `UV ${a.uv}`, value: a.uv <= 2 ? 'No SPF needed' : a.uv <= 5 ? 'SPF at lunch' : 'SPF and shades' });
  if (s.cover.washing) t.push({ tone: 'green', title: 'Washing', value: a.washing.s });
  if (s.cover.commute) t.push({ tone: 'layer', title: 'Commute', value: a.commute.s });
  while (t.length < 4) t.push({ tone: 'layer', title: 'Range', value: `${tStr(a.lo)} to ${tStr(a.hi)}` });
  return t.slice(0, 4);
}

function entry(a: Advice, settings: Settings, mode: CardiWidgetProps['mode']): CardiWidgetProps {
  const s = forDay(settings, a.dayKey);
  // Today the big number is how it feels right now; tomorrow's is the trip out.
  const today = mode !== 'tomorrow';
  const feels = today ? a.nowFeels : a.mine;
  const verdict = mode === 'home' ? (a.brolly ? 'Brolly out' : a.step.day) : a.step.day;
  const label =
    mode === 'tomorrow' ? (a.off ? 'Tomorrow · day off' : `Tomorrow, ${fmtClock(s.leave)}`) : 'Feels like now';
  const headline = mode === 'home' ? (a.brolly ? `Rain at ${fmtHour(a.rainStart ?? s.back)}.` : 'Dry way home.') : `${a.step.day}.`;
  const headline2 =
    mode === 'home'
      ? a.brolly
        ? 'Brolly out.'
        : `Feels ${tStr(a.homeFeels)}.`
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
  // Above the clock: "Feels 9–17° · Jacket · Brolly home"
  const [lo, hi] = today ? [a.spanLo, a.spanHi] : [a.mine, a.peak];
  const range = hi - lo >= 3 ? `${deg(lo)}–${deg(hi)}°` : tStr(feels);
  const rain = mode === 'home' ? a.rHome >= 40 : a.brolly;
  const rainWord = a.rOut >= 40 && a.rHome >= 40 ? 'Brolly' : a.rHome >= 40 ? 'Brolly home' : 'Brolly in';
  const showers = mode !== 'home' && !!a.midRain;
  const wet = a.nextWet;
  const snowTrip = mode === 'home' ? a.snowHome : a.snowOut || a.snowHome;
  const inline =
    `Feels ${range} · ${a.step.short}` +
    (wet ? ` · ${wet.snow ? 'Snow' : 'Rain'} ${wet.now ? 'now' : fmtHour(wet.h)}` : rain ? ` · ${snowTrip ? 'Snow' : rainWord}` : showers ? ' · Showers' : '');
  const inlineSymbol: SFSymbol = wet
    ? wet.snow
      ? 'snowflake'
      : 'cloud.rain.fill'
    : rain
      ? snowTrip
        ? 'snowflake'
        : 'umbrella.fill'
      : showers
        ? 'cloud.rain.fill'
        : OUTFIT_SYMBOL[a.step.art];
  return {
    skin: s.skin,
    mode,
    label,
    // The widget shows numbers as-is, so they go across already in °F if that's what you use.
    feels: deg(feels),
    range,
    actual: deg(today ? a.nowTemp : a.actual),
    when: today ? 'now' : 'way out',
    lo: deg(a.lo),
    hi: deg(a.hi),
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

/** When the widget turns to tomorrow: your setting, but never before you're home. */
export function flipHour(s: Settings, day: number) {
  return Math.min(23.5, Math.max(s.tomorrowAt ?? 20, forDay(s, day).back + 0.5));
}

/**
 * The widget shows the right moment of the day without the app running:
 * from 5am it's how it feels now, hour by hour (the trip home takes over late afternoon),
 * and from your "show tomorrow from" time in the evening it's tomorrow's plan, ready for when you wake up.
 */
export function buildTimeline(f: Forecast, s: Settings, now = Date.now()) {
  const today = localDayKey(f, now);
  const nowH = localHourOf(f, now);
  const out: { date: Date; props: CardiWidgetProps }[] = [];
  for (const day of [today, today + 1]) {
    const ds = forDay(s, day);
    const flip = timeAt(f, day, flipHour(s, day));
    // Days off have no trip home, so the "heading home" view never starts.
    const homeFrom = isWorkDay(s, day) ? timeAt(f, day, Math.max(ds.leave + 1, ds.back - 2)) : Infinity;
    // Today: an entry for right now, then one an hour. Tomorrow: from 5am, before anyone is looking.
    for (let h = day === today ? Math.floor(nowH) : 5; h < flipHour(s, day); h++) {
      const isNow = day === today && h <= nowH;
      const at = isNow ? now : timeAt(f, day, h);
      if (at >= flip) break;
      const a = advise(f, s, day, isNow ? nowH : h);
      if (a) out.push({ date: new Date(at), props: entry(a, s, at < homeFrom ? 'morning' : 'home') });
    }
    const next = advise(f, s, day + 1);
    if (next) out.push({ date: new Date(Math.max(now, flip)), props: entry(next, s, 'tomorrow') });
  }
  return out.filter((e, i, arr) => i === 0 || e.date.getTime() > arr[i - 1].date.getTime());
}

/** Push the latest advice to the Home and Lock Screen widgets. Safe to call anywhere. */
export async function syncWidgets(f: Forecast, s: Settings) {
  try {
    setUnits(s);
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
