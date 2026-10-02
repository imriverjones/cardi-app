import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { useApp } from '@/state/app-state';

/**
 * The day as a ring: 6am at the top, clockwise. Daylight is shaded, the hours
 * you're outside are highlighted, rain is dotted around the outside and the
 * current time is a small marker.
 */
export function DayRing({
  size,
  out,
  rain,
  nowHour,
  children,
}: {
  size: number;
  out: [number, number][];
  rain: [number, number] | null;
  nowHour: number | null;
  children?: ReactNode;
}) {
  const { palette } = useApp();
  const r = 130;
  const C = 2 * Math.PI * r;
  const arc = (s: number, e: number) => ({
    strokeDasharray: `${Math.max(0, ((e - s) / 24) * C)} ${C}`,
    strokeDashoffset: -(((s - 6 + 24) % 24) / 24) * C,
  });
  const point = (rad: number, h: number) => {
    const a = ((h - 6) / 24) * 2 * Math.PI - Math.PI / 2;
    return [150 + rad * Math.cos(a), 150 + rad * Math.sin(a)];
  };
  const dots: number[][] = [];
  if (rain) for (let h = rain[0]; h <= rain[1] + 1; h += 0.4) dots.push(point(147, h));
  const now = nowHour != null ? point(r, nowHour) : null;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 300 300">
        <Circle cx={150} cy={150} r={r} fill={palette.paper} />
        <Circle cx={150} cy={150} r={r} fill="none" stroke={palette.ring} strokeWidth={18} />
        <Circle cx={150} cy={150} r={r} fill="none" stroke={palette.day} strokeWidth={18} {...arc(7, 19)} rotation={-90} origin="150,150" />
        {out.map(([s, e], i) => (
          <Circle
            key={i}
            cx={150}
            cy={150}
            r={r}
            fill="none"
            stroke={palette.accent}
            strokeWidth={18}
            strokeLinecap="round"
            {...arc(s + 0.25, e - 0.25)}
            rotation={-90}
            origin="150,150"
          />
        ))}
        {dots.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={2.2} fill={palette.rain} />
        ))}
        {now && <Circle cx={now[0]} cy={now[1]} r={9} fill={palette.paper} stroke={palette.ink} strokeWidth={3} />}
        {[
          [6, '6am'],
          [12, 'noon'],
          [18, '6pm'],
        ].map(([h, t]) => {
          const [x, y] = point(104, h as number);
          return (
            <SvgText key={t} x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight="600" fill={palette.ink3}>
              {t}
            </SvgText>
          );
        })}
      </Svg>
      <View style={{ position: 'absolute', top: '19%', left: '19%', right: '19%', bottom: '19%', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
