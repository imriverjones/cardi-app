import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DayPlan } from '@/components/day-plan';
import { Box, Pill, T, tap, Wordmark } from '@/components/ui';
import { useNow } from '@/components/use-now';
import { WeatherCredit } from '@/components/weather-credit';
import { LockPreview } from '@/components/widget-preview';
import { localDayKey, localHourOf } from '@/engine/advice';
import { useApp } from '@/state/app-state';
import { track } from '@/analytics';

export default function Today() {
  const { advice: a, settings: s, palette: p, status, error, refresh, feedback, lastFeedback, forecast, update } = useApp();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const now = useNow();

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh(true);
    setRefreshing(false);
  };

  if (!a || !forecast) {
    return (
      <View style={{ flex: 1, backgroundColor: p.bg2, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
        <Wordmark size={34} />
        {status === 'error' ? (
          <>
            <T w="semibold" size={16} style={{ textAlign: 'center' }} color={p.ink2}>
              {error}
            </T>
            <Pill label="Pick a city" onPress={() => router.push('/place')} />
            <Pill label="Try again" onPress={() => refresh(true)} />
          </>
        ) : (
          <>
            <ActivityIndicator color={p.accent} />
            <T color={p.ink3}>Checking the sky…</T>
          </>
        )}
      </View>
    );
  }

  const isToday = a.dayKey === localDayKey(forecast, now);
  // Right now, as the iPhone Weather app shows it, so the two always agree.
  const current = forecast.hours.reduce<(typeof forecast.hours)[number] | null>(
    (best, h) => (h.t <= now && (!best || h.t > best.t) ? h : best),
    null
  );
  const nowH = isToday ? localHourOf(forecast, now) : null;
  const hour = nowH ?? 0;
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  // Asking how the day felt only makes sense once you're on your way home.
  const showCheckIn = isToday && hour >= Math.min(16, s.back);
  const showWidgetCard = !s.widgetAdded && now > s.widgetSnoozeUntil;

  const fbText =
    lastFeedback === 'cold'
      ? `Got it. Your feels like is now ${a.mine}°, and I'll dress you warmer.`
      : lastFeedback === 'warm'
        ? `Got it. Your feels like is now ${a.mine}°, and I'll suggest lighter layers.`
        : lastFeedback === 'ok'
          ? "Lovely. I'll keep it just like this."
          : 'Each answer tunes your feels like.';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.bg2 }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40, paddingHorizontal: 20, gap: 18 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.accent} />}>
      <View style={{ position: 'absolute', top: -400, left: -20, right: -20, height: 760, backgroundColor: p.bg1 }} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Wordmark size={24} />
          <T w="heavy" size={27} style={{ marginTop: 8, letterSpacing: -0.5 }}>
            {s.name ? `${greeting}, ${s.name}` : greeting}
          </T>
          <Pressable onPress={() => router.push('/place')} accessibilityRole="button" accessibilityHint="Change location">
            <T color={p.ink3} size={14}>
              {new Date(now).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · {a.place}
            </T>
          </Pressable>
          {current && (
            <T w="semibold" size={14} color={p.ink2}>
              {`Now ${Math.round(current.temp)}°, feels ${Math.round(current.feels)}°`}
            </T>
          )}
        </View>
        <Pressable
          onPress={() => router.navigate('/me')}
          accessibilityLabel="Your settings"
          style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: p.tOther, alignItems: 'center', justifyContent: 'center' }}>
          <T w="heavy" size={16} color={p.dOther}>
            {(s.name || '?')[0].toUpperCase()}
          </T>
        </Pressable>
      </View>

      <DayPlan a={a} s={s} p={p} nowH={nowH} />

      {showWidgetCard && (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add Cardi to your Lock Screen. Show me how"
            onPress={() => {
              tap();
              router.push('/widgets');
            }}
            style={({ pressed }) => ({ backgroundColor: p.paper, borderRadius: 24, borderWidth: 1, borderColor: p.line, padding: 14, flexDirection: 'row', gap: 14, alignItems: 'center', transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <View style={{ width: 118 }}>
              <LockPreview a={a} s={s} scale={0.5} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <T w="heavy" size={16} style={{ lineHeight: 20 }}>
                See this without opening the app
              </T>
              <T size={13} color={p.ink2} style={{ lineHeight: 18 }}>
                Add Cardi to your Lock Screen. Takes 20 seconds.
              </T>
              <T w="bold" size={13.5} color={p.accentText} style={{ marginTop: 2 }}>
                Show me how ›
              </T>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hide for now"
            hitSlop={10}
            onPress={() => {
              tap();
              track('widget_card_hidden');
              update({ widgetSnoozeUntil: now + 3 * 864e5 });
            }}
            style={{ position: 'absolute', right: 8, top: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: p.field, alignItems: 'center', justifyContent: 'center' }}>
            <T w="bold" size={13} color={p.ink3}>
              ✕
            </T>
          </Pressable>
        </View>
      )}

      {showCheckIn && (
        <Box style={{ padding: 16 }}>
          <T w="heavy" size={16} style={{ marginBottom: 12 }}>
            How did today feel?
          </T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(
              [
                ['cold', 'Bit chilly'],
                ['ok', 'Spot on'],
                ['warm', 'Too warm'],
              ] as const
            ).map(([answer, label]) => (
              <Pill
                key={answer}
                label={label}
                on={lastFeedback === answer}
                onPress={() => {
                  track('feels_feedback', { answer, from: 'app' });
                  feedback(answer);
                }}
              />
            ))}
          </View>
          <T size={13} color={p.ink2} style={{ marginTop: 10 }}>
            {fbText}
          </T>
        </Box>
      )}

      <View style={{ gap: 6 }}>
        {error && (
          <T size={12} color={p.ink3} style={{ textAlign: 'center' }}>
            {error}
          </T>
        )}
        <WeatherCredit forecast={forecast} />
      </View>
    </ScrollView>
  );
}
