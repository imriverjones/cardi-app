import type { Forecast, Hour, Settings } from './types';

/* ---------- time helpers (all in the forecast location's local time) ---------- */

const DAY = 86_400_000;

export function localDayKey(f: Forecast, t: number) {
  return Math.floor((t + f.utcOffsetSeconds * 1000) / DAY);
}

export function localHourOf(f: Forecast, t: number) {
  const ms = (t + f.utcOffsetSeconds * 1000) % DAY;
  return (ms < 0 ? ms + DAY : ms) / 3_600_000;
}

/** Unix ms for a local hour (decimal) on a given local day key. */
export function timeAt(f: Forecast, dayKey: number, hour: number) {
  return dayKey * DAY + hour * 3_600_000 - f.utcOffsetSeconds * 1000;
}

/** 24 slots for one local day; gaps are filled from the nearest known hour. */
export function hoursForDay(f: Forecast, dayKey: number): Hour[] {
  const slots: (Hour | undefined)[] = Array(24).fill(undefined);
  for (const h of f.hours) {
    if (localDayKey(f, h.t) === dayKey) slots[Math.floor(localHourOf(f, h.t))] = h;
  }
  const known = slots.map((h, i) => (h ? i : -1)).filter((i) => i >= 0);
  if (!known.length) return [];
  return slots.map((h, i) => {
    if (h) return h;
    const nearest = known.reduce((a, b) => (Math.abs(b - i) < Math.abs(a - i) ? b : a));
    return slots[nearest]!;
  });
}

export function fmtHour(h: number) {
  const hh = Math.floor(h) % 24;
  const m = Math.round((h - Math.floor(h)) * 60);
  const s = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  return `${s}${m ? ':' + String(m).padStart(2, '0') : ''}${hh < 12 ? 'am' : 'pm'}`;
}

export function fmtClock(h: number) {
  const hh = Math.floor(h) % 24;
  const m = Math.round((h - Math.floor(h)) * 60);
  return `${hh}:${String(m).padStart(2, '0')}`;
}

const range = (a: number, b: number) => {
  const out: number[] = [];
  for (let h = Math.max(0, Math.floor(a)); h <= Math.min(23, Math.ceil(b)); h++) out.push(h);
  return out;
};

/* ---------- wording ---------- */

export const MOVE = {
  walk: { adj: 0, label: 'Walk', verb: 'walk' },
  cycle: { adj: -2, label: 'Cycle', verb: 'ride' },
  transit: { adj: -1, label: 'Bus or train', verb: 'journey' },
} as const;

type StepKey = 'bigcoat' | 'coat' | 'jacket' | 'light' | 'tee';

/** What to wear, in the words that fit how you dress. No gender assumed. */
const WEAR: Record<StepKey, Record<Settings['wear'], string>> = {
  bigcoat: {
    trousers: 'Warmest coat, scarf, gloves and a hat',
    dresses: 'Warmest coat, thick tights and a scarf',
    mix: 'Your warmest coat, scarf and gloves',
  },
  coat: {
    trousers: 'A proper coat over a jumper',
    dresses: 'Coat over a knit, with thick tights',
    mix: 'A proper coat over a cosy knit',
  },
  jacket: {
    trousers: 'Denim jacket or overshirt over a jumper',
    dresses: 'Denim jacket over a soft knit, tights on',
    mix: 'Denim jacket over a soft knit',
  },
  light: {
    trousers: 'A light jumper or overshirt',
    dresses: 'A light knit. Bare legs by lunch',
    mix: 'A light knit or an open shirt',
  },
  tee: {
    trousers: 'T-shirt and shorts weather',
    dresses: "A sundress or a tee, that's it",
    mix: "A tee, and that's it",
  },
};

export type Step = {
  max: number;
  key: StepKey;
  day: string;
  short: string;
  art: 'coat' | 'jacket' | 'knit' | 'tee';
  bag: string | null;
  kid: string;
};

export const STEPS: Step[] = [
  { max: 3, key: 'bigcoat', day: 'Big coat day', short: 'Big coat', art: 'coat', bag: 'Gloves', kid: 'Big coat, hat and gloves' },
  { max: 8, key: 'coat', day: 'Coat day', short: 'Coat', art: 'coat', bag: 'Scarf', kid: 'Winter coat and a hat' },
  { max: 13, key: 'jacket', day: 'Jacket day', short: 'Jacket', art: 'jacket', bag: 'Jacket', kid: 'Coat over a jumper' },
  { max: 17, key: 'light', day: 'Light layer day', short: 'Light layer', art: 'knit', bag: 'Layer', kid: 'A hoodie or light jacket' },
  { max: 99, key: 'tee', day: 'T-shirt day', short: 'T-shirt', art: 'tee', bag: null, kid: 'T-shirt, plus a sun hat' },
];

export function stepFor(feels: number, windy: boolean): Step {
  let i = STEPS.findIndex((s) => feels < s.max);
  if (i < 0) i = STEPS.length - 1;
  if (windy && i > 0) i--;
  return STEPS[i];
}

/** The standard feels like, adjusted for this person. */
export function personal(v: number, s: Settings) {
  const move = s.cover.commute ? MOVE[s.move].adj : 0;
  return Math.round(v - s.bias * 1.5 + move);
}

/* ---------- work days and days off ---------- */

/** On a day off there's no commute: Cardi plans for being out and about between these hours. */
export const DAY_OFF = { leave: 10, back: 17 };

/** 0 = Sunday … 6 = Saturday. Day keys count local days from 1 Jan 1970, a Thursday. */
export const weekday = (dayKey: number) => (((dayKey + 4) % 7) + 7) % 7;

export const isWorkDay = (s: Settings, dayKey: number) => (s.workDays ?? [1, 2, 3, 4, 5]).includes(weekday(dayKey));

/** The settings that apply on this day: on days off, a 10am–5pm window and no commute. */
export function forDay(s: Settings, dayKey: number): Settings {
  return isWorkDay(s, dayKey) ? s : { ...s, ...DAY_OFF, cover: { ...s.cover, commute: false } };
}

/* ---------- the advice ---------- */

export type Line = { s: string; m: string };

export type Advice = {
  place: string;
  dayKey: number;
  hours: Hour[];
  outHours: number[];
  standard: number;
  mine: number;
  /** Real air temperature at the moment `mine` describes */
  actual: number;
  /** Whether `mine` is the trip out or the trip home */
  when: 'out' | 'home';
  /** Real air temperature on the way home */
  homeTemp: number;
  lunch: number;
  warmUp: boolean;
  windy: boolean;
  maxWind: number;
  step: Step;
  wear: string;
  hi: number;
  lo: number;
  rainStart: number | null;
  rainEnd: number | null;
  rOut: number;
  rHome: number;
  brolly: boolean;
  uv: number;
  uvPeak: number;
  dew: number;
  frizz: number;
  curly: boolean;
  hair: { label: string; short: string; tip: string };
  /** Something for your hair in the bag (claw clip, hair tie), or null */
  hairBag: string | null;
  commute: Line;
  kids: Line;
  washing: Line;
  bag: string[];
  /** Personal feels like at the trip home */
  homeFeels: number;
  /** Warmest you'll feel while you're away, and when */
  peak: number;
  peakHour: number;
  /** Showers between your trips (not on them), as [start, end] hours */
  midRain: [number, number] | null;
  /** Personal feels like when you leave */
  leaveFeels: number;
  /** Today only: how it feels right now (for you) and the real temperature, same hour Apple Weather shows */
  nowFeels: number;
  nowTemp: number;
  /** Today only: what's still to come, coldest to warmest, for "Feels 11–14°" */
  spanLo: number;
  spanHi: number;
  /** Whether your trip out is already behind you */
  outDone: boolean;
  /** A day off: no commute, just the hours you might be out and about */
  off: boolean;
};

/**
 * `fromHour` is the local hour "now" when this is today's advice. Once the trip out is over,
 * the advice only looks at what's still ahead, so at 2pm it isn't still saying how cold 8am was.
 */
export function advise(f: Forecast, settings: Settings, dayKey = localDayKey(f, Date.now()), fromHour = 0): Advice | null {
  const d = hoursForDay(f, dayKey);
  if (d.length < 24) return null;

  const off = !isWorkDay(settings, dayKey);
  const s = forDay(settings, dayKey);
  // Work days: two trips. Days off: the whole 10am–5pm window, or what's left of it.
  const nowH = Math.min(23, Math.floor(fromHour));
  const window = range(s.leave, s.back).filter((h) => h >= nowH);
  const outDone = !off && fromHour >= s.leave + 1;
  const ahead = (h: number) => (off ? h >= nowH : !outDone || h >= nowH);
  const legOut = off ? (window.length ? window : [nowH]) : range(s.leave, s.leave + 1);
  const legHome = off ? [Math.min(23, Math.ceil(s.back))] : range(s.back, s.back + 1);
  const out = off ? legOut : outDone ? legHome : [...new Set([...legOut, ...legHome])];

  const standard = Math.round(Math.min(...out.map((h) => d[h].feels)));
  const mine = personal(standard, s);
  // The hour that sets the number, so we can show the real temperature and say which trip it is.
  const coldestHour = out.reduce((a, b) => (d[b].feels < d[a].feels ? b : a));
  const actual = Math.round(d[coldestHour].temp);
  const when: 'out' | 'home' = legOut.includes(coldestHour) ? 'out' : 'home';
  const maxWind = Math.round(Math.max(...out.map((h) => d[h].wind)));
  const windy = maxWind >= 30;
  const step = stepFor(mine, windy);
  const wear = WEAR[step.key][s.wear] ?? WEAR[step.key].mix;
  const lunch = personal(d[13].feels, s);
  // Warmest point of the hours you're away, so we can say "warms to 17° by 2pm".
  const awayAll = range(s.leave, s.back).filter(ahead);
  const awayHours = awayAll.length ? awayAll : legHome;
  const peakHour = awayHours.reduce((x, y) => (d[y].feels > d[x].feels ? y : x), awayHours[0] ?? 13);
  const peak = personal(d[peakHour].feels, s);
  const warmUp = peak - mine >= 5;
  const leaveFeels = personal(Math.min(...legOut.map((h) => d[h].feels)), s);
  const homeFeels = personal(Math.min(...legHome.map((h) => d[h].feels)), s);

  const rainHrs = d.map((h, i) => (i >= 7 && i <= 22 && h.rain >= 40 ? i : -1)).filter((i) => i >= 0);
  const rainStart = rainHrs.length ? rainHrs[0] : null;
  const rainEnd = rainHrs.length ? rainHrs[rainHrs.length - 1] : null;
  // Rain on a trip that's already happened doesn't need a brolly any more.
  const rOut = outDone ? 0 : Math.round(Math.max(...legOut.map((h) => d[h].rain)));
  const rHome = off ? rOut : Math.round(Math.max(...legHome.map((h) => d[h].rain)));
  const brolly = Math.max(rOut, rHome) >= 40;
  const midHrs = off ? [] : range(s.leave + 1, s.back - 0.5).filter((h) => ahead(h) && d[h].rain >= 50);
  const midRain: [number, number] | null = !brolly && midHrs.length ? [midHrs[0], midHrs[midHrs.length - 1] + 1] : null;

  const uvVals = d.map((h, i) => (ahead(i) ? h.uv : 0));
  const uvMax = Math.max(...uvVals);
  const uv = Math.round(uvMax);
  const uvPeak = uvVals.indexOf(uvMax);

  const dew = Math.max(...out.map((h) => d[h].dew), d[13].dew);
  const curly = s.hair === 'curly' || s.hair === 'wavy';
  let frizz = Math.max(0, Math.min(10, Math.round((dew - 2) / 1.8)));
  if (!curly) frizz = Math.max(0, frizz - 2);

  // Hair tips follow how you dress, not a gender: claw clips and blow-dries only for "dresses & skirts",
  // a hair tie for "a mix", and plain product tips for "trousers & jeans".
  const style = s.wear;
  const pick = (dresses: string, mix: string, trousers: string) => (style === 'dresses' ? dresses : style === 'mix' ? mix : trousers);
  let hair: Advice['hair'];
  if (s.hair === 'short') {
    hair = { label: 'Low-fuss hair day', short: 'easy hair day', tip: maxWind >= 30 ? 'Windy out. A bit of product keeps it in place.' : 'Nothing to worry about today.' };
  } else if (dew < 4) {
    hair = {
      label: 'Static-y day',
      short: 'static-y hair day',
      tip: curly
        ? pick('Dry air today. Seal in moisture with a leave-in and skip the brush.', 'Dry air today. A leave-in keeps it soft.', 'Dry air today. A bit of leave-in keeps it soft.')
        : 'Flyaways likely. A little product keeps them down.',
    };
  } else if (frizz <= 3) {
    hair = { label: 'Good hair day', short: 'good hair day', tip: "Air's just right. Wear it however you like." };
  } else if (frizz <= 6) {
    hair = {
      label: 'Almost a good hair day',
      short: 'almost a good hair day',
      tip: curly
        ? pick('Curls get puffy after lunch. Leave-in now, claw clip in your bag.', 'Gets puffy after lunch. Leave-in now, hair tie in your bag.', 'Gets puffy after lunch. A bit of product before you go.')
        : 'Might go a bit flat later. A little texture product helps.',
    };
  } else {
    hair = {
      label: curly ? 'Frizz alert' : 'Flat hair day',
      short: curly ? 'frizz alert' : 'flat hair day',
      tip: curly
        ? pick('Very humid. Anti-frizz serum, or wear it up and own it.', 'Very humid. Anti-frizz product, or tie it back.', 'Very humid. Product in before you go, or a cap if it gets wild.')
        : pick('Humid air will flatten it. Skip the blow-dry, try a sleek style.', 'Humid air will flatten it. A matte product holds best.', 'Humid air will flatten it. A matte product holds best.'),
    };
  }

  const verb = MOVE[s.move].verb;
  const commute: Line = {
    s: rHome >= 40 && rOut < 40 ? `Dry ${verb} in, wet ${verb} home` : rOut >= 40 ? `Wet ${verb} in` : 'Dry both ways',
    m:
      s.move === 'cycle'
        ? rHome >= 40 || rOut >= 40
          ? 'Pack waterproof trousers'
          : `Wind ${maxWind} km/h, ${maxWind >= 22 ? "so it'll feel colder" : 'easy riding'}`
        : s.move === 'transit'
          ? `Waiting at the stop feels about ${mine}°`
          : brolly
            ? 'Brolly in your bag'
            : 'No brolly needed',
  };

  const kidFeels = Math.round(d[8].feels);
  const kidStep = stepFor(kidFeels, d[8].wind >= 30);
  const kids: Line = {
    s: kidStep.kid,
    m: d[8].rain >= 40 || d[15].rain >= 40 ? 'Plus wellies and a waterproof' : `Feels ${kidFeels}° at drop-off`,
  };

  let dryUntil = 9;
  while (dryUntil < 18 && d[dryUntil].rain < 30) dryUntil++;
  const humid = Math.max(...range(9, 15).map((h) => d[h].dew)) >= 15;
  const cold = Math.max(...range(9, 16).map((h) => d[h].temp)) < 6;
  const washing: Line = cold
    ? { s: 'Too cold to dry outside', m: 'Use the airer inside' }
    : dryUntil >= 17
      ? humid
        ? { s: "Slow drying, it's humid", m: "Dry, but it'll take all day" }
        : { s: 'Great drying day', m: 'Hang it out, dry by teatime' }
      : dryUntil >= 13
        ? { s: `Drying day until ${fmtHour(dryUntil)}`, m: 'Bring it in before the rain' }
        : { s: 'Not a drying day', m: 'Use the airer inside' };

  const bag: string[] = [];
  if (s.cover.outfit && step.bag) bag.push(step.bag);
  if (brolly) bag.push(s.cover.commute && s.move === 'cycle' ? 'Waterproofs' : 'Brolly');
  if (s.cover.skin && uv >= 3) bag.push('SPF');
  const hairBag = s.cover.hair && frizz >= 4 && curly ? (style === 'dresses' ? 'Claw clip' : style === 'mix' ? 'Hair tie' : null) : null;
  if (hairBag) bag.push(hairBag);

  const temps = d.map((h) => h.temp);
  const nowHour = d[Math.min(23, Math.floor(fromHour))];
  const nowFeels = Math.round(nowHour.feels - s.bias * 1.5);
  return {
    nowFeels,
    nowTemp: Math.round(nowHour.temp),
    spanLo: Math.min(mine, nowFeels),
    spanHi: Math.max(peak, nowFeels),
    outDone,
    off,
    place: f.place,
    dayKey,
    hours: d,
    outHours: out,
    standard,
    mine,
    actual,
    when,
    homeTemp: Math.round(Math.min(...legHome.map((h) => d[h].temp))),
    lunch,
    warmUp,
    windy,
    maxWind,
    step,
    wear,
    hi: Math.round(Math.max(...temps)),
    lo: Math.round(Math.min(...temps)),
    rainStart,
    rainEnd,
    rOut,
    rHome,
    brolly,
    uv,
    uvPeak,
    dew,
    frizz,
    curly,
    hair,
    hairBag,
    commute,
    kids,
    washing,
    bag,
    homeFeels,
    leaveFeels,
    peak,
    peakHour,
    midRain,
  };
}

/** Advice for every full day in the forecast, starting today. */
export function week(f: Forecast, s: Settings) {
  const today = localDayKey(f, Date.now());
  const out: Advice[] = [];
  for (let k = today; k < today + 8; k++) {
    const a = advise(f, s, k);
    if (a) out.push(a);
  }
  return out;
}

export function uvAdvice(uv: number) {
  if (uv <= 2) return { title: 'Skip the SPF today', body: 'UV stays low all day, so no sun protection needed.', short: 'No SPF needed' };
  if (uv <= 5)
    return { title: `UV ${uv}. SPF if you're out a while`, body: "It peaks around lunch. It's stronger than it feels on a cool day.", short: 'A little SPF if out' };
  return { title: `UV ${uv}. SPF on, shades out`, body: 'Strong sun around midday. SPF 30+, sunglasses, and some shade at lunch.', short: 'SPF 30+ and shades' };
}
