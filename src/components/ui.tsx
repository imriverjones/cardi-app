import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useApp } from '@/state/app-state';
import { FONT } from '@/theme/skins';

export const tap = () => Haptics.selectionAsync().catch(() => {});

export function T({ children, style, w = 'medium', size = 15, color, numberOfLines }: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  w?: keyof typeof FONT;
  size?: number;
  color?: string;
  numberOfLines?: number;
}) {
  const { palette } = useApp();
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontFamily: FONT[w], fontSize: size, color: color ?? palette.ink }, style]}>
      {children}
    </Text>
  );
}

/** "cardi" wordmark: the dot of the i is a cardigan button. */
export function Wordmark({ size = 24 }: { size?: number }) {
  const { palette } = useApp();
  const btn = size * 0.3;
  const text = { fontFamily: FONT.black, fontSize: size, color: palette.ink, lineHeight: size * 1.15 };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }} accessibilityLabel="Cardi" accessible>
      <Text style={[text, { letterSpacing: -size * 0.05 }]}>card</Text>
      <View style={{ alignItems: 'center', marginLeft: -size * 0.02 }}>
        <Text style={text}>ı</Text>
        <View style={{ position: 'absolute', top: size * 0.15 }}>
          <Svg width={btn} height={btn} viewBox="0 0 40 40">
            <Circle cx={20} cy={20} r={19} fill={palette.accent} />
            <Circle cx={15} cy={15} r={2.8} fill={palette.bg1} />
            <Circle cx={25} cy={15} r={2.8} fill={palette.bg1} />
            <Circle cx={15} cy={25} r={2.8} fill={palette.bg1} />
            <Circle cx={25} cy={25} r={2.8} fill={palette.bg1} />
          </Svg>
        </View>
      </View>
    </View>
  );
}

export function Box({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { palette } = useApp();
  return <View style={[{ backgroundColor: palette.paper, borderColor: palette.line, borderWidth: 1, borderRadius: 22 }, style]}>{children}</View>;
}

export function Row({ children, last }: { children: ReactNode; last?: boolean }) {
  const { palette } = useApp();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 54,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: palette.line,
      }}>
      {children}
    </View>
  );
}

export function Seg<V extends string>({ value, options, onChange }: { value: V; options: [V, string][]; onChange: (v: V) => void }) {
  const { palette } = useApp();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: palette.field, borderRadius: 16, padding: 3, gap: 2 }}>
      {options.map(([v, label]) => {
        const on = v === value;
        return (
          <Pressable
            key={v}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => {
              tap();
              onChange(v);
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 13,
              backgroundColor: on ? palette.paper : 'transparent',
              shadowColor: '#000',
              shadowOpacity: on ? 0.1 : 0,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
            }}>
            <T size={13} w={on ? 'bold' : 'semibold'}>
              {label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Pill({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  const { palette } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 99,
        backgroundColor: on ? palette.ink : palette.field,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}>
      <T w="bold" size={14} color={on ? palette.onInk : palette.ink}>
        {label}
      </T>
    </Pressable>
  );
}

export function BigButton({ label, onPress, kind = 'ink', disabled }: { label: string; onPress: () => void; kind?: 'ink' | 'soft'; disabled?: boolean }) {
  const { palette } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.big,
        { backgroundColor: kind === 'ink' ? palette.ink : palette.paper, opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <T w="bold" size={16} color={kind === 'ink' ? palette.onInk : palette.ink}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  big: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 99 },
});
