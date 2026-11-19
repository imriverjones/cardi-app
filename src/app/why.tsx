import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WeatherCredit } from '@/components/weather-credit';
import { BigButton, Box, T } from '@/components/ui';
import { advise, fmtClock, verdict, wetChance } from '@/engine/advice';
import { t, wind } from '@/engine/units';
import { useApp } from '@/state/app-state';

/** The working behind the verdict, so nobody has to double-check it in another app. */
export default function WhyScreen() {
  const { palette: p, advice, forecast, settings } = useApp();
  const insets = useSafeAreaInsets();
  const { day } = useLocalSearchParams<{ day?: string }>();
  if (!forecast || !advice) return null;

  const dayKey = day ? Number(day) : advice.dayKey;
  const a = dayKey === advice.dayKey ? advice : advise(forecast, settings, dayKey);
  if (!a) return null;

  const isToday = a.dayKey === advice.dayKey;
  const trips = a.off
    ? '10:00–17:00, your day off'
    : `${fmtClock(settings.leave)} out and ${fmtClock(settings.back)} home`;
  const wet = Math.max(a.rOut, a.rHome);
  const worst = a.hours.reduce((m, h) => Math.max(m, wetChance(h)), 0);
  const rows: [string, string][] = [
    ['The hours that count', trips],
    ["Apple Weather's feels like", `${t(a.standard)} at the coldest point${a.applePeak - a.standard >= 3 ? `, up to ${t(a.applePeak)}` : ''}`],
    ['Rain or snow', wet >= 40 ? `${wet}% chance while you're out` : worst >= 40 ? 'Dry while you are out, wet later' : 'Dry while you are out'],
    ['Wind', a.windy ? `Gusting ${wind(a.maxWind)}, so one step warmer` : `Up to ${wind(a.maxWind)}, nothing to worry about`],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: p.bg2 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 16 }}>
        <View style={{ gap: 6 }}>
          <T w="heavy" size={26} style={{ letterSpacing: -0.6, lineHeight: 30 }}>
            {verdict(a)}
          </T>
          <T size={15} color={p.ink2} style={{ lineHeight: 21 }}>
            {isToday ? 'Here is how Cardi got there. ' : 'Here is how Cardi got there for that day. '}
            The numbers are Apple Weather&apos;s own, so they will match what you see there.
          </T>
        </View>
        <Box>
          {rows.map(([k, v], i) => (
            <View key={k} style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 2, borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: p.line }}>
              <T w="bold" size={12.5} color={p.ink3}>
                {k}
              </T>
              <T w="semibold" size={15.5}>
                {v}
              </T>
            </View>
          ))}
        </Box>
        {a.tuned ? (
          <Box style={{ padding: 16, gap: 4 }}>
            <T w="heavy" size={15.5}>
              Tuned to you
            </T>
            <T size={14} color={p.ink2} style={{ lineHeight: 20 }}>
              On Apple&apos;s number alone this would be &ldquo;{a.plain.day}&rdquo;. Cardi says &ldquo;{a.step.day}&rdquo; because of how you said you feel the cold
              {settings.cover.commute ? ' and how you get about' : ''}. You can change that in Me, under &ldquo;You usually feel&rdquo;.
            </T>
          </Box>
        ) : null}
        <WeatherCredit forecast={forecast} />
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 14 }}>
        <BigButton label="Got it" onPress={() => router.back()} />
      </View>
    </View>
  );
}
