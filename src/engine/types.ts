export type Hair = 'curly' | 'wavy' | 'straight' | 'short';
export type Wear = 'trousers' | 'dresses' | 'mix';
export type Move = 'walk' | 'cycle' | 'transit';
export type Skin = 'blush' | 'stone' | 'night';

export type Cover = {
  outfit: boolean;
  hair: boolean;
  skin: boolean;
  commute: boolean;
  kids: boolean;
  washing: boolean;
};

export type Place = { name: string; lat: number; lon: number };

export type Settings = {
  name: string;
  hair: Hair;
  wear: Wear;
  move: Move;
  /** Hours as decimals, e.g. 17.5 = 5:30pm */
  leave: number;
  back: number;
  /** -3 (runs warm) … +3 (runs cold) */
  bias: number;
  skin: Skin;
  cover: Cover;
  onboarded: boolean;
  /** null = use the phone's current location */
  place: Place | null;
  /** The person said they've added a widget, so stop suggesting it */
  widgetAdded: boolean;
  /** Don't show the "add the widget" card again before this time (ms) */
  widgetSnoozeUntil: number;
  /** Morning notification on/off, and when (decimal hours) */
  notify: boolean;
  notifyAt: number;
  /** Days you commute, 0 = Sunday … 6 = Saturday. Other days are planned as a day off. */
  workDays: number[];
};

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  hair: 'curly',
  wear: 'mix',
  move: 'walk',
  leave: 8,
  back: 17.5,
  bias: 0,
  skin: 'blush',
  cover: { outfit: true, hair: true, skin: true, commute: false, kids: false, washing: false },
  onboarded: false,
  place: null,
  widgetAdded: false,
  widgetSnoozeUntil: 0,
  notify: false,
  notifyAt: 7.25,
  workDays: [1, 2, 3, 4, 5],
};

/** One forecast hour. `t` is a unix timestamp in ms. */
export type Hour = {
  t: number;
  temp: number;
  /** Standard "feels like" (apparent temperature) */
  feels: number;
  dew: number;
  rain: number;
  uv: number;
  wind: number;
  code: number;
};

export type Forecast = {
  place: string;
  lat: number;
  lon: number;
  utcOffsetSeconds: number;
  fetchedAt: number;
  /** Where the numbers came from, for the on-screen credit. Older caches have none. */
  source?: 'apple' | 'open-meteo';
  hours: Hour[];
};
