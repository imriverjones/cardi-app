import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DayRing } from '@/components/day-ring';
import { Box, Pill, T, tap, Wordmark } from '@/components/ui';
import { useNow } from '@/components/use-now';
import { LockPreview } from '@/components/widget-preview';
import { localDayKey, localHourOf } from '@/engine/advice';
import { useApp } from '@/state/app-state';
import type { Palette } from '@/theme/skins';
import type { Tone } from '@/widgets/CardiWidget';
import { alerts } from '@/widgets/sync';

const toneColors = (p: Palette, tone: Tone) =>
  ({
    rain: [p.tRain, p.dRain],
    layer: [p.tLayer, p.dLayer],
    sun: [p.tSun, p.dSun],
    hair: [p.tHair, p.dHair],
    green: [p.tGreen, p.dGreen],
    other: [p.tOther, p.dOther],
  })[tone];

export default function Today() {
  const { advice: a, settings: s, palette: p, status, error, refresh, feedback, lastFeedback, forecast, update } = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
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
  const nowH = isToday ? localHourOf(forecast, now) : null;
  const ringSize = Math.min(width - 60, 300);
  const rows = alerts(a, s, 'morning');
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

      <View style={{ alignItems: 'center', gap: 10 }}>
        <DayRing
          size={ringSize}
          nowHour={nowH}
          out={[
            [s.leave, s.leave + 1],
            [s.back, s.back + 1],
          ]}
          rain={a.rainStart != null ? [a.rainStart, a.rainEnd!] : null}>
          <T w="bold" size={12.5} color={p.ink3}>
            Feels like for you
          </T>
          <T w="black" size={ringSize * 0.22} style={{ letterSpacing: -3, lineHeight: ringSize * 0.24 }}>
            {`${a.mine}°`}
          </T>
          <T w="heavy" size={17} style={{ textAlign: 'center' }}>
            {a.step.day}
          </T>
          <T size={13} color={p.ink2} style={{ textAlign: 'center' }}>
            {`${a.actual}° actual · on your ${a.when === 'out' ? 'way out' : 'way home'}`}
          </T>
        </DayRing>
        {s.cover.outfit && (
          <T w="semibold" size={15} color={p.ink2} style={{ textAlign: 'center', paddingHorizontal: 12 }}>
            {a.wear}
          </T>
        )}
      </View>

      <Box style={{ overflow: 'hidden' }}>
        {rows.map((r, i) => {
          const [bg, fg] = toneColors(p, r.tone);
          return (
            <View
              key={r.text}
              accessible
              accessibilityLabel={`${r.text}. ${r.sub ?? ''}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: p.line }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                <SymbolView name={r.symbol} size={19} tintColor={fg} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                <T w="heavy" size={16}>
                  {r.text}
                </T>
                {r.sub ? (
                  <T size={13} color={p.ink2}>
                    {r.sub}
                  </T>
                ) : null}
              </View>
            </View>
          );
        })}
      </Box>

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
            <Pill label="Bit chilly" on={lastFeedback === 'cold'} onPress={() => feedback('cold')} />
            <Pill label="Spot on" on={lastFeedback === 'ok'} onPress={() => feedback('ok')} />
            <Pill label="Too warm" on={lastFeedback === 'warm'} onPress={() => feedback('warm')} />
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
        <T size={11} color={p.ink3} style={{ textAlign: 'center' }}>
          Weather data by Open-Meteo.com · updated {new Date(forecast.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </T>
      </View>
    </ScrollView>
  );
}
