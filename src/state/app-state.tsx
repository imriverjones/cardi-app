import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { advise, localDayKey, localHourOf, type Advice } from '@/engine/advice';
import { useNow } from '@/components/use-now';
import { DEFAULT_SETTINGS, type Forecast, type Settings } from '@/engine/types';
import { SKINS, type Palette } from '@/theme/skins';
import { cachedForecast, currentPlace, fetchForecast, isFresh } from '@/weather/forecast';
import { scheduleMornings } from '@/notify/morning';
import { syncCheckInSkin, syncWidgets, takeCheckInAnswer } from '@/widgets/sync';
import { track } from '@/analytics';

const SETTINGS_KEY = 'cardi.settings';

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...s, cover: { ...DEFAULT_SETTINGS.cover, ...(s.cover ?? {}) } };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const persist = (s: Settings) => {
  AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s)).catch(() => {});
};

type Status = 'loading' | 'ready' | 'error';
type Answer = 'cold' | 'ok' | 'warm';

type Ctx = {
  ready: boolean;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  palette: Palette;
  forecast: Forecast | null;
  advice: Advice | null;
  status: Status;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
  /** Apply a "bit chilly / spot on / too warm" answer */
  feedback: (answer: Answer) => void;
  lastFeedback: Answer | null;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<Answer | null>(null);
  const settingsRef = useRef(settings);
  const hasForecast = useRef(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    hasForecast.current = !!forecast;
  }, [forecast]);

  // Load saved settings and the cached forecast so the app opens instantly.
  useEffect(() => {
    (async () => {
      const [s, f] = await Promise.all([loadSettings(), cachedForecast()]);
      settingsRef.current = s;
      setSettings(s);
      if (f) {
        setForecast(f);
        setStatus('ready');
      }
      setReady(true);
    })();
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch, cover: { ...prev.cover, ...(patch.cover ?? {}) } };
      persist(next);
      return next;
    });
  }, []);

  const feedback = useCallback((answer: Answer) => {
    setSettings((prev) => {
      const bias = answer === 'cold' ? Math.min(3, prev.bias + 1) : answer === 'warm' ? Math.max(-3, prev.bias - 1) : prev.bias;
      const next = { ...prev, bias };
      persist(next);
      return next;
    });
    setLastFeedback(answer);
  }, []);

  const refresh = useCallback(async (force = false) => {
    const s = settingsRef.current;
    try {
      const place = s.place ?? (await currentPlace(s.onboarded));
      if (!place) {
        setError('Turn on location, or pick a city in Me, to get your forecast.');
        setStatus(hasForecast.current ? 'ready' : 'error');
        return;
      }
      const cached = await cachedForecast();
      const f = !force && cached && isFresh(cached, place) ? cached : await fetchForecast(place);
      setForecast(f);
      setError(null);
      setStatus('ready');
    } catch {
      setError("Couldn't get the forecast. Check your connection and pull down to try again.");
      setStatus(hasForecast.current ? 'ready' : 'error');
    }
  }, []);

  // Fetch once settings are loaded and onboarding is done, and when the place changes.
  const placeKey = settings.place ? `${settings.place.lat},${settings.place.lon}` : 'gps';
  useEffect(() => {
    // refresh() only sets state after awaiting the network, so this doesn't cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready && settings.onboarded) refresh(placeKey !== 'gps');
  }, [ready, settings.onboarded, placeKey, refresh]);

  // Coming back to the app: refresh, and pick up any answer from the check-in widget.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active' || !settingsRef.current.onboarded) return;
      refresh();
      const answer = await takeCheckInAnswer();
      if (answer) {
        track('feels_feedback', { answer, from: 'widget' });
        feedback(answer);
      }
    });
    return () => sub.remove();
  }, [refresh, feedback]);

  // Recomputed every minute, so the advice moves on once you've left the house.
  const now = useNow();
  const advice = forecast ? advise(forecast, settings, localDayKey(forecast, now), localHourOf(forecast, now)) : null;

  // Keep the widgets in step with the app.
  useEffect(() => {
    if (forecast && settings.onboarded) syncWidgets(forecast, settings);
  }, [forecast, settings]);
  // Morning notifications are rebuilt from the latest forecast, so they always say the right thing.
  useEffect(() => {
    if (forecast && settings.onboarded) scheduleMornings(forecast, settings);
  }, [forecast, settings]);
  useEffect(() => {
    if (ready) syncCheckInSkin(settings);
  }, [ready, settings]);

  const value: Ctx = {
    ready,
    settings,
    update,
    palette: SKINS[settings.skin],
    forecast,
    advice,
    status,
    error,
    refresh,
    feedback,
    lastFeedback,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
