import { SymbolView } from 'expo-symbols';
import { View, useWindowDimensions } from 'react-native';

import { DayRing } from '@/components/day-ring';
import { Box, T } from '@/components/ui';
import { fmtClock, forDay, type Advice } from '@/engine/advice';
import type { Settings } from '@/engine/types';
import type { Palette } from '@/theme/skins';
import type { Tone } from '@/widgets/CardiWidget';
import { alerts } from '@/widgets/sync';

export const toneColors = (p: Palette, tone: Tone) =>
  ({
    rain: [p.tRain, p.dRain],
    layer: [p.tLayer, p.dLayer],
    sun: [p.tSun, p.dSun],
    hair: [p.tHair, p.dHair],
    green: [p.tGreen, p.dGreen],
    other: [p.tOther, p.dOther],
  })[tone];

/** The ring, the outfit line and the short list: one day's plan. Used by Today and by a day from Week. */
export function DayPlan({ a, s: settings, p, nowH, trips }: { a: Advice; s: Settings; p: Palette; nowH: number | null; trips?: boolean }) {
  const s = forDay(settings, a.dayKey);
  const { width } = useWindowDimensions();
  const ringSize = Math.min(width - 60, 300);
  const rows = alerts(a, s, 'morning');
  // Today the big number is right now; the outfit and the line under it are about what's still to come.
  const today = nowH != null;
  const next = a.off
    ? 'day off'
    : today && !a.outDone ? `${a.leaveFeels}° on your way out` : today && nowH < s.back + 1 ? `${a.homeFeels}° on your way home` : 'for the rest of today';

  return (
    <>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <DayRing
          size={ringSize}
          nowHour={nowH}
          out={
            a.off
              ? [[s.leave, s.back]]
              : [
                  [s.leave, s.leave + 1],
                  [s.back, s.back + 1],
                ]
          }
          rain={a.rainStart != null ? [a.rainStart, a.rainEnd!] : null}>
          <T w="bold" size={12.5} color={p.ink3}>
            {today ? 'Feels like now' : 'Feels like for you'}
          </T>
          <T w="black" size={ringSize * 0.22} style={{ letterSpacing: -3, lineHeight: ringSize * 0.24 }}>
            {`${today ? a.nowFeels : a.mine}°`}
          </T>
          <T w="heavy" size={17} style={{ textAlign: 'center' }}>
            {a.step.day}
          </T>
          <T size={13} color={p.ink2} style={{ textAlign: 'center' }}>
            {today ? `${a.nowTemp}° actual · ${next}` : a.off ? `${a.actual}° actual · day off` : `${a.actual}° actual · on your ${a.when === 'out' ? 'way out' : 'way home'}`}
          </T>
        </DayRing>
        {s.cover.outfit && (
          <T w="semibold" size={15} color={p.ink2} style={{ textAlign: 'center', paddingHorizontal: 12 }}>
            {a.wear}
          </T>
        )}
      </View>

      {trips && !a.off && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { label: `Out at ${fmtClock(s.leave)}`, feels: a.leaveFeels, rain: a.rOut },
            { label: `Home at ${fmtClock(s.back)}`, feels: a.homeFeels, rain: a.rHome },
          ].map((t) => (
            <Box key={t.label} style={{ flex: 1, padding: 14, gap: 2 }}>
              <T w="bold" size={12.5} color={p.ink3}>
                {t.label}
              </T>
              <T w="heavy" size={22}>{`${t.feels}°`}</T>
              <T size={13} color={p.ink2}>
                {t.rain >= 40 ? `${t.rain}% chance of rain` : 'Dry'}
              </T>
            </Box>
          ))}
        </View>
      )}

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
    </>
  );
}
