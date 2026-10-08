import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toneColors } from '@/components/day-plan';
import { Box, T, tap } from '@/components/ui';
import { useNow } from '@/components/use-now';
import { localDayKey, week } from '@/engine/advice';
import { useApp } from '@/state/app-state';
import { alerts } from '@/widgets/sync';
import { track } from '@/analytics';

export default function Week() {
  const { forecast, settings: s, palette: p } = useApp();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const days = forecast ? week(forecast, s) : [];
  const today = forecast ? localDayKey(forecast, now) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg2 }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110, paddingHorizontal: 20 }}>
      <T w="heavy" size={27} style={{ letterSpacing: -0.5 }}>
        Your week
      </T>
      <T color={p.ink3} style={{ marginTop: 4, marginBottom: 16 }}>
        What to wear each day{forecast ? ` in ${forecast.place}` : ''}. Tap a day for the full plan.
      </T>
      <Box style={{ overflow: 'hidden' }}>
        {days.map((d, i) => {
          const date = new Date(d.dayKey * 86_400_000 + 12 * 3_600_000);
          const top = alerts(d, s, 'morning')[0];
          const [bg, fg] = toneColors(p, top.tone);
          const name = d.dayKey === today ? 'Today' : d.dayKey === today + 1 ? 'Tomorrow' : date.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
          return (
            <Pressable
              key={d.dayKey}
              accessibilityRole="button"
              accessibilityLabel={`${name}: feels ${d.mine} degrees, ${d.step.day}. ${top.text}`}
              onPress={() => {
                tap();
                track('day_opened', { daysAhead: d.dayKey - today });
                router.push({ pathname: '/day', params: { k: String(d.dayKey) } });
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 13,
                backgroundColor: pressed ? p.field : 'transparent',
                borderBottomWidth: i === days.length - 1 ? 0 : 1,
                borderBottomColor: p.line,
              })}>
              <View style={{ width: 44, alignItems: 'flex-start' }}>
                <T w="black" size={22} style={{ letterSpacing: -0.5 }}>{`${d.mine}°`}</T>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <T w="bold" size={13} color={p.ink3}>
                  {name}
                </T>
                <T w="heavy" size={16}>
                  {d.step.day}
                </T>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                    <SymbolView name={top.symbol} size={11} tintColor={fg} />
                  </View>
                  <T size={13} color={p.ink2} numberOfLines={1} style={{ flex: 1 }}>
                    {top.text}
                  </T>
                </View>
              </View>
              <T w="bold" size={18} color={p.ink3}>
                ›
              </T>
            </Pressable>
          );
        })}
      </Box>
      <T size={12} color={p.ink3} style={{ marginTop: 10, paddingHorizontal: 6 }}>
        The number is your feels like for the hours you’re out.
      </T>
    </ScrollView>
  );
}
