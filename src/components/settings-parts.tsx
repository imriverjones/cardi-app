import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { fmtHour } from '@/engine/advice';
import type { Cover } from '@/engine/types';
import { useApp } from '@/state/app-state';
import { SKIN_LIST, SKINS } from '@/theme/skins';

import { T, tap } from './ui';

export const COVER_OPTIONS: { key: keyof Cover; title: string; sub: string }[] = [
  { key: 'outfit', title: 'Outfit', sub: 'What to wear, from your own feels like' },
  { key: 'hair', title: 'Hair', sub: 'Frizz, flat or static, before you style it' },
  { key: 'skin', title: 'Skin & SPF', sub: 'UV, even on cool days' },
  { key: 'commute', title: 'Commute', sub: 'Walking, cycling or bus, wet or dry' },
  { key: 'kids', title: 'School run', sub: 'What to put the kids in' },
  { key: 'washing', title: 'Drying day', sub: 'Can the washing go out?' },
];

export const BIAS_OPTIONS: { v: number; title: string; sub?: string }[] = [
  { v: 3, title: "I'm always cold", sub: 'Feels about 4° colder to me' },
  { v: 1, title: 'A bit chilly usually' },
  { v: 0, title: 'About average' },
  { v: -1, title: 'A bit warm usually' },
  { v: -3, title: "I'm always too warm", sub: 'Feels about 4° warmer to me' },
];

/** A big tappable option with a tick, used in setup. */
export function Option({ title, sub, on, onPress }: { title: string; sub?: string; on: boolean; onPress: () => void }) {
  const { palette: p } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 2,
        borderColor: on ? p.accent : p.line,
        backgroundColor: p.paper,
        borderRadius: 18,
        padding: 14,
      }}>
      <View style={{ flex: 1 }}>
        <T w="bold" size={16}>
          {title}
        </T>
        {sub ? (
          <T size={13} color={p.ink3}>
            {sub}
          </T>
        ) : null}
      </View>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: on ? p.accent : p.line,
          backgroundColor: on ? p.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {on && (
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={p.onAccent} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </View>
    </Pressable>
  );
}

/** − 8:00am + in quarter-hour steps */
export function TimeStepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const { palette: p } = useApp();
  const step = (d: number) => {
    tap();
    onChange(Math.min(23.75, Math.max(0, value + d)));
  };
  const btn = (txt: string, d: number, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${a11y} ${label}`}
      onPress={() => step(d)}
      style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: p.field, alignItems: 'center', justifyContent: 'center' }}>
      <T w="heavy" size={18}>
        {txt}
      </T>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {btn('−', -0.25, 'Earlier')}
      <T w="bold" size={16} style={{ minWidth: 64, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
        {fmtHour(value)}
      </T>
      {btn('+', 0.25, 'Later')}
    </View>
  );
}

export function SkinPicker() {
  const { settings, update, palette: p } = useApp();
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {SKIN_LIST.map(({ key, label }) => {
        const k = SKINS[key];
        const on = settings.skin === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${label} look`}
            onPress={() => {
              tap();
              update({ skin: key });
            }}
            style={{ flex: 1, borderWidth: 2, borderColor: on ? p.accent : 'transparent', borderRadius: 20, padding: 8, backgroundColor: p.paper, alignItems: 'center', gap: 8 }}>
            <View style={{ width: '100%', aspectRatio: 1 / 1.1, borderRadius: 14, backgroundColor: k.bg1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: '46%', aspectRatio: 1, borderRadius: 99, borderWidth: 7, borderColor: k.day, borderTopColor: k.accent, borderRightColor: k.accent }} />
            </View>
            <T w="bold" size={13}>
              {label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
