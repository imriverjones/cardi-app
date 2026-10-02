import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Outfit, Sun, Umbrella, Waves } from '@/components/art';
import { DayRing } from '@/components/day-ring';
import { buildStories, seenStories, type StoryKind } from '@/components/stories';
import { Box, Pill, T, tap, Wordmark } from '@/components/ui';
import { fmtHour, localHourOf, localDayKey, MOVE, uvAdvice } from '@/engine/advice';
import { useNow } from '@/components/use-now';
import { useApp } from '@/state/app-state';
import type { Palette } from '@/theme/skins';

function StoryThumb({ kind, palette, art }: { kind: StoryKind; palette: Palette; art: 'coat' | 'jacket' | 'knit' | 'tee' }) {
  const bg = { outfit: palette.tLayer, hair: palette.tHair, rain: palette.tRain, sun: palette.tSun }[kind];
  return (
    <View style={{ width: '100%', height: '100%', borderRadius: 99, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {kind === 'outfit' && <Outfit art={art} size={34} />}
      {kind === 'hair' && <Waves size={34} />}
      {kind === 'rain' && <Umbrella size={34} color="#F28A99" />}
      {kind === 'sun' && <Sun size={34} />}
    </View>
  );
}

export default function Today() {
  const { advice: a, settings: s, palette: p, status, error, refresh, feedback, lastFeedback, forecast } = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [, force] = useState(0);
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

  const stories = buildStories(a, s);
  const isToday = a.dayKey === localDayKey(forecast, now);
  const nowH = isToday ? localHourOf(forecast, now) : null;
  const ringSize = Math.min(width - 40, 320);
  const diff = a.mine !== a.standard;
  const curlyHair = s.cover.hair && s.hair !== 'short';

  const cards: { b: string; bg: string; c: string; s: string; m: string }[] = [];
  if (s.cover.outfit) cards.push({ b: 'WEAR', bg: p.tLayer, c: p.dLayer, s: a.wear, m: a.warmUp ? `${a.mine}° now, ${a.lunch}° by lunch` : a.windy ? 'Breezy, so zip it up' : 'One good layer does it' });
  if (s.cover.hair) cards.push({ b: 'HAIR', bg: p.tHair, c: p.dHair, s: a.hair.label, m: a.hair.tip.split('. ')[1] ?? a.hair.tip });
  if (s.cover.skin) cards.push({ b: 'SKIN', bg: p.tSun, c: p.dSun, s: a.uv <= 2 ? 'UV stays low' : `UV ${a.uv} around ${fmtHour(a.uvPeak)}`, m: uvAdvice(a.uv).short });
  if (s.cover.commute) cards.push({ b: MOVE[s.move].label.toUpperCase(), bg: p.tRain, c: p.dRain, s: a.commute.s, m: a.commute.m });
  if (s.cover.kids) cards.push({ b: 'SCHOOL RUN', bg: p.tLayer, c: p.dLayer, s: a.kids.s, m: a.kids.m });
  if (s.cover.washing) cards.push({ b: 'WASHING', bg: p.tGreen, c: p.dGreen, s: a.washing.s, m: a.washing.m });
  cards.push({ b: 'BAG', bg: p.tOther, c: p.dOther, s: a.bag.length ? a.bag.join(', ') : 'Travel light', m: 'Everything you need today' });

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
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.accent} />}>
      <View style={{ position: 'absolute', top: -400, left: 0, right: 0, height: 760, backgroundColor: p.bg1 }} />

      <View style={{ paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Wordmark size={24} />
          <T w="heavy" size={27} style={{ marginTop: 8, letterSpacing: -0.5 }}>
            {s.name ? `Hi ${s.name}` : 'Hi there'}
          </T>
          <T color={p.ink3} size={14}>
            {new Date(now).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </T>
          <Pressable onPress={() => router.push('/place')} accessibilityRole="button" style={{ alignSelf: 'flex-start', marginTop: 6 }}>
            <View style={{ backgroundColor: p.paper, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
              <T w="semibold" size={12} color={p.accentText}>
                {a.place}
                {s.place ? '' : ' · current location'}
              </T>
            </View>
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
        {stories.map((st, i) => {
          const seen = seenStories.has(`${st.id}-${a.dayKey}`);
          return (
            <Pressable
              key={st.id}
              accessibilityRole="button"
              accessibilityLabel={`${st.label} story`}
              onPress={() => {
                tap();
                router.push({ pathname: '/story', params: { i: String(i) } });
                setTimeout(() => force((n) => n + 1), 500);
              }}
              style={{ alignItems: 'center', gap: 6, width: 72 }}>
              <View style={{ width: 70, height: 70, borderRadius: 35, padding: 3, backgroundColor: seen ? p.line : p.accent }}>
                <View style={{ flex: 1, borderRadius: 99, borderWidth: 3, borderColor: p.bg2, overflow: 'hidden' }}>
                  <StoryThumb kind={st.id} palette={p} art={a.step.art} />
                </View>
              </View>
              <T w="semibold" size={12} color={seen ? p.ink3 : p.ink} numberOfLines={1}>
                {st.label}
              </T>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ alignItems: 'center', marginTop: 14 }}>
        <View>
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
            <T w="black" size={ringSize * 0.19} style={{ letterSpacing: -3, lineHeight: ringSize * 0.21 }}>
              {`${a.mine}°`}
            </T>
            <T w="heavy" size={15} style={{ textAlign: 'center' }}>
              {s.cover.outfit ? a.step.day : a.brolly ? 'Rain later' : 'Dry day'}
            </T>
            <T size={13} color={p.ink2} style={{ textAlign: 'center' }}>
              {diff ? `${a.standard}° for most people · ` : ''}
              {a.brolly ? `rain ${fmtHour(a.rainStart!)}` : 'dry all day'}
            </T>
            {stories.length > 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/story', params: { i: '0' } })}
                style={({ pressed }) => ({ marginTop: 8, backgroundColor: p.accent, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
                <T w="bold" size={13.5} color={p.onAccent}>
                  {s.cover.outfit ? 'See your outfit' : 'See today'}
                </T>
              </Pressable>
            )}
          </DayRing>
          {curlyHair && (
            <View
              style={{
                position: 'absolute',
                right: -6,
                top: 8,
                width: 82,
                height: 82,
                borderRadius: 41,
                backgroundColor: p.ink,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                transform: [{ rotate: '12deg' }],
              }}>
              <T w="bold" size={11} color={p.onInk} style={{ textAlign: 'center' }}>
                {a.hair.short}
              </T>
            </View>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 22, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <T w="heavy" size={18}>
          Your insights
        </T>
        <T size={13} color={p.ink3}>
          Swipe
        </T>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
        {cards.map((c) => (
          <View key={c.b} style={{ width: 152, minHeight: 156, borderRadius: 22, padding: 14, backgroundColor: c.bg, justifyContent: 'space-between', gap: 8 }}>
            <T w="heavy" size={12} color={c.c} style={{ letterSpacing: 0.5 }}>
              {c.b}
            </T>
            <T w="heavy" size={17}>
              {c.s}
            </T>
            <T size={12.5} color={p.ink2}>
              {c.m}
            </T>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
        <Box style={{ padding: 16 }}>
          <T w="heavy" size={16} style={{ marginBottom: 12 }}>
            How did yesterday feel to you?
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
        {error && (
          <T size={12} color={p.ink3} style={{ marginTop: 12, textAlign: 'center' }}>
            {error}
          </T>
        )}
        <T size={11} color={p.ink3} style={{ marginTop: 14, textAlign: 'center' }}>
          Weather data by Open-Meteo.com · updated {new Date(forecast.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </T>
      </View>
    </ScrollView>
  );
}
