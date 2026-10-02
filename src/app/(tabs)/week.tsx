import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WeatherIcon } from '@/components/art';
import { Box, T } from '@/components/ui';
import { localDayKey, week } from '@/engine/advice';
import { useNow } from '@/components/use-now';
import { useApp } from '@/state/app-state';

export default function Week() {
  const { forecast, settings: s, palette: p } = useApp();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const days = forecast ? week(forecast, s) : [];
  const today = forecast ? localDayKey(forecast, now) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg2 }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40, paddingHorizontal: 20 }}>
      <T w="heavy" size={27} style={{ letterSpacing: -0.5 }}>
        Your week
      </T>
      <T color={p.ink3} style={{ marginTop: 4, marginBottom: 16 }}>
        What to wear each day{forecast ? ` in ${forecast.place}` : ''}, for the hours you’re out.
      </T>
      <Box style={{ overflow: 'hidden' }}>
        {days.map((d, i) => {
          const date = new Date(d.dayKey * 86_400_000 + 12 * 3_600_000);
          const mid = d.hours[13];
          const extras = [`feels ${d.mine}° for you`, d.brolly ? 'rain' : null, s.cover.skin && d.uv >= 5 ? `UV ${d.uv}` : null, s.cover.hair && d.frizz >= 7 && d.curly ? 'frizz' : null]
            .filter(Boolean)
            .join(' · ');
          return (
            <View
              key={d.dayKey}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 16,
                paddingVertical: 13,
                borderBottomWidth: i === days.length - 1 ? 0 : 1,
                borderBottomColor: p.line,
              }}>
              <T w="bold" style={{ width: 52 }}>
                {d.dayKey === today ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })}
              </T>
              <WeatherIcon code={mid.code} rain={Math.max(d.rOut, d.rHome)} />
              <View style={{ flex: 1 }}>
                <T w="bold">{d.step.day}</T>
                <T size={13} color={p.ink3} numberOfLines={1}>
                  {extras}
                </T>
              </View>
              <T w="semibold" size={14} color={p.ink2} style={{ fontVariant: ['tabular-nums'] }}>
                {`${d.hi}° / ${d.lo}°`}
              </T>
            </View>
          );
        })}
      </Box>
    </ScrollView>
  );
}
