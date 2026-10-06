import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import type { Settings } from '@/engine/types';

import { startAnalytics, track, trackDaily } from './index';

type Source = { source: 'icon' | 'widget' | 'notification'; size?: string };

/** Counts every time Cardi is opened, and whether it came from the icon, a widget or the morning notification. */
export function useTrackOpens(settings: Settings, ready: boolean) {
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!ready) return;
    startAnalytics();
    let pending: Source | null = null;

    const fromUrl = (url: string | null) => {
      if (!url) return;
      const q = Linking.parse(url).queryParams ?? {};
      if (q.from === 'widget') pending = { source: 'widget', size: String(q.size ?? 'unknown') };
      else if (q.from === 'notification') pending = { source: 'notification' };
    };
    // The link or notification tap arrives just after the app becomes active, so wait a moment.
    const report = () =>
      setTimeout(() => {
        const p: Source = pending ?? { source: 'icon' };
        pending = null;
        track('app_open', p.size ? { source: p.source, size: p.size } : { source: p.source });
        trackDaily(settingsRef.current);
      }, 700);

    Linking.getInitialURL().then(fromUrl).catch(() => {});
    const last = Notifications.getLastNotificationResponse();
    const at = last ? (last.notification.date < 1e12 ? last.notification.date * 1000 : last.notification.date) : 0;
    if (last && Date.now() - at < 15_000) pending = { source: 'notification' };
    let timer = report();

    const urlSub = Linking.addEventListener('url', (e) => fromUrl(e.url));
    const noteSub = Notifications.addNotificationResponseReceivedListener(() => {
      pending = { source: 'notification' };
    });
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') timer = report();
    });
    return () => {
      clearTimeout(timer);
      urlSub.remove();
      noteSub.remove();
      appSub.remove();
    };
  }, [ready]);
}
