import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { loadSettings } from '@/state/app-state';
import { cachedForecast, fetchForecast, isFresh, lastPlace } from '@/weather/forecast';
import { scheduleMornings } from '@/notify/morning';
import { syncWidgets } from '@/widgets/sync';

/*
 * Every so often (iOS decides when, usually a few times a day) refresh the
 * forecast, the widget and the morning notifications, so they stay right even if the app isn't opened.
 */
export const REFRESH_TASK = 'cardi-refresh-forecast';

TaskManager.defineTask(REFRESH_TASK, async () => {
  try {
    const s = await loadSettings();
    if (!s.onboarded) return BackgroundTask.BackgroundTaskResult.Success;
    const place = s.place ?? (await lastPlace());
    if (!place) return BackgroundTask.BackgroundTaskResult.Success;
    const cached = await cachedForecast();
    const f = isFresh(cached, place) && cached ? cached : await fetchForecast(place);
    await syncWidgets(f, s);
    await scheduleMornings(f, s);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundRefresh() {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
    const registered = await TaskManager.isTaskRegisteredAsync(REFRESH_TASK);
    if (!registered) await BackgroundTask.registerTaskAsync(REFRESH_TASK, { minimumInterval: 60 });
  } catch {
    // Not available in Expo Go or on web.
  }
}
