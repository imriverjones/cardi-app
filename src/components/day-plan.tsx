import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { DayRing } from '@/components/day-ring';
import { Box, T, tap } from '@/components/ui';
import { fmtClock, fmtHour, forDay, isSnow, personal, stepFor, wetChance, type Advice } from '@/engine/advice';
import { t } from '@/engine/units';
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
export function DayPlan({
  a,
  s: settings,
  p,
  nowH,
  trips,
  onScrubbing,
}: {
  a: Advice;
  s: Settings;
  p: Palette;
  nowH: number | null;
  trips?: boolean;
  /** Tells the screen a finger is on the ring, so the page doesn't scroll under it */
  onScrubbing?: (on: boolean) => void;
}) {
  const s = forDay(settings, a.dayKey);
  const [scrub, setScrub] = useState<number | null>(null);
  const lastHour = useRef<number | null>(null);
  const onScrub = (h: number | null) => {
    setScrub(h);
    onScrubbing?.(h != null);
    const hh = h == null ? null : Math.min(23, Math.floor(h));
    if (hh != null && hh !== lastHour.current) tap();
    lastHour.current = hh;
  };
  const sh = scrub != null ? Math.min(23, Math.floor(scrub)) : null;
  const hr = sh != null ? a.hours[sh] : null;
  const { width } = useWindowDimensions();
  const ringSize = Math.min(width - 60, 300);
  const rows = alerts(a, s, 'morning');
  // Today the big number is right now; the outfit and the line under it are about what's still to come.
  const today = nowH != null;
  const next = a.off
    ? 'day off'
    : today && !a.outDone ? `${t(a.leaveFeels)} on your way out` : today && nowH < s.back + 1 ? `${t(a.homeFeels)} on your way home` : 'for the rest of today';

  return (
    <>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <DayRing
          size={ringSize}
          nowHour={nowH}
          scrubHour={scrub}
          onScrub={onScrub}
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
            {hr ? `Feels like at ${fmtHour(sh!)}` : today ? 'Feels like now' : 'Feels like for you'}
          </T>
          <T w="black" size={ringSize * 0.22} style={{ letterSpacing: -3, lineHeight: ringSize * 0.24 }}>
            {t(hr ? personal(hr.feels, s) : today ? a.nowFeels : a.mine)}
          </T>
          <T w="heavy" size={17} style={{ textAlign: 'center' }}>
            {hr ? stepFor(personal(hr.feels, s), hr.wind >= 30).day : a.step.day}
          </T>
          <T size={13} color={p.ink2} style={{ textAlign: 'center' }}>
            {hr
              ? `${t(hr.temp)} actual · ${wetChance(hr) >= 20 ? `${wetChance(hr)}% ${isSnow(hr) ? 'snow' : 'rain'}` : 'dry'}`
              : today
                ? `${t(a.nowTemp)} actual · ${next}`
                : a.off
                  ? `${t(a.actual)} actual · day off`
                  : `${t(a.actual)} actual · on your ${a.when === 'out' ? 'way out' : 'way home'}`}
          </T>
        </DayRing>
        <T size={12} color={p.ink3}>
          Drag around the ring to see any hour
        </T>
      </View>

      {trips && !a.off && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { label: `Out at ${fmtClock(s.leave)}`, feels: a.leaveFeels, rain: a.rOut },
            { label: `Home at ${fmtClock(s.back)}`, feels: a.homeFeels, rain: a.rHome },
          ].map((trip) => (
            <Box key={trip.label} style={{ flex: 1, padding: 14, gap: 2 }}>
              <T w="bold" size={12.5} color={p.ink3}>
                {trip.label}
              </T>
              <T w="heavy" size={22}>{t(trip.feels)}</T>
              <T size={13} color={p.ink2}>
                {trip.rain >= 40 ? `${trip.rain}% chance of rain` : 'Dry'}
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
