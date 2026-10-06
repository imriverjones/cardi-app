import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { DayPlan } from '@/components/day-plan';
import { T, tap } from '@/components/ui';
import { useNow } from '@/components/use-now';
import { WeatherCredit } from '@/components/weather-credit';
import { advise, localDayKey, localHourOf } from '@/engine/advice';
import { useApp } from '@/state/app-state';

/** One day from Week: the same plan as Today, plus your trip out and home. */
export default function DayScreen() {
  const { forecast, settings: s, palette: p } = useApp();
  const { k } = useLocalSearchParams<{ k?: string }>();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const dayKey = Number(k);
  const a = forecast && Number.isFinite(dayKey) ? advise(forecast, s, dayKey) : null;
  const isToday = forecast ? dayKey === localDayKey(forecast, now) : false;
  const title = isToday
    ? 'Today'
    : new Date(dayKey * 86_400_000 + 12 * 3_600_000).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg2 }} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 40, paddingHorizontal: 20, gap: 18 }}>
      <View style={{ position: 'absolute', top: -400, left: -20, right: -20, height: 760, backgroundColor: p.bg1 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to your week"
          onPress={() => {
            tap();
            router.back();
          }}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.paper, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path d="M15 5l-7 7 7 7" stroke={p.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
        <View style={{ flex: 1 }}>
          <T w="heavy" size={24} style={{ letterSpacing: -0.4 }}>
            {title}
          </T>
          {forecast && (
            <T size={13} color={p.ink3}>
              {forecast.place}
            </T>
          )}
        </View>
      </View>

      {a && forecast ? (
        <>
          <DayPlan a={a} s={s} p={p} nowH={isToday ? localHourOf(forecast, now) : null} trips />
          <WeatherCredit forecast={forecast} />
        </>
      ) : (
        <T color={p.ink2}>No forecast for this day yet.</T>
      )}
    </ScrollView>
  );
}
