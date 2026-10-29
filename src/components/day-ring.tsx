import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { useApp } from '@/state/app-state';

/**
 * The day as a ring: 6am at the top, clockwise. Daylight is shaded, the hours
 * you're outside are highlighted, rain is dotted around the outside and the
 * current time is a small marker. Labels outside the ring say which is which.
 */
// The ring is drawn in a 352-unit square; SIDE extra units each side give room for labels at 3 and 9 o'clock.
const SVG_H = 352;
const SIDE = 34;
const SVG_W = SVG_H + SIDE * 2;

export function DayRing({
  size,
  out,
  rain,
  nowHour,
  scrubHour,
  onScrub,
  children,
}: {
  size: number;
  out: [number, number][];
  rain: [number, number] | null;
  nowHour: number | null;
  /** The hour a finger is on, while someone is dragging around the ring */
  scrubHour?: number | null;
  onScrub?: (hour: number | null) => void;
  children?: ReactNode;
}) {
  const { palette } = useApp();

  // Drag around the ring (not the middle, so the page still scrolls) to read off any hour.
  const cb = useRef(onScrub);
  useEffect(() => {
    cb.current = onScrub;
  });
  const origin = useRef({ x: 0, y: 0 });
  // The refs below are only read when a finger moves, never while rendering.
  /* eslint-disable react-hooks/refs */
  const pan = useMemo(() => {
    const c = size / 2;
    const hourAt = (x: number, y: number) => {
      const h = 6 + ((Math.atan2(y - c, x - c) + Math.PI / 2) / (2 * Math.PI)) * 24;
      return ((h % 24) + 24) % 24;
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        const r = Math.hypot(e.nativeEvent.locationX - c, e.nativeEvent.locationY - c);
        return r >= size * 0.3 && r <= size * 0.52;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const n = e.nativeEvent;
        origin.current = { x: n.pageX - n.locationX, y: n.pageY - n.locationY };
        cb.current?.(hourAt(n.locationX, n.locationY));
      },
      onPanResponderMove: (_e, g) => cb.current?.(hourAt(g.moveX - origin.current.x, g.moveY - origin.current.y)),
      onPanResponderRelease: () => cb.current?.(null),
      onPanResponderTerminate: () => cb.current?.(null),
    });
  }, [size]);
  /* eslint-enable react-hooks/refs */
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
  const scrub = scrubHour != null ? point(r, Math.floor(scrubHour) + 0.5) : null;

  // Labels just outside the ring: "out", "home", "now" and "rain". Close ones are merged or dropped so they never overlap.
  const near = (a: number, b: number) => Math.abs(((a - b + 36) % 24) - 12) < 1.5;
  const mid = ([s, e]: [number, number]) => (s + e) / 2;
  const labels: { h: number; text: string; color: string }[] = [];
  const names = ['out', 'home'];
  out.forEach((o, i) => {
    const h = mid(o);
    const wet = rain && h >= rain[0] - 0.5 && h <= rain[1] + 1.5;
    labels.push({ h, text: `${names[i] ?? ''}${wet ? ' · rain' : ''}`, color: palette.accentText });
  });
  if (rain && !labels.some((l) => near(l.h, rain[0] + 0.5))) labels.push({ h: rain[0] + 0.5, text: 'rain', color: palette.rain });
  if (nowHour != null && !labels.some((l) => near(l.h, nowHour))) labels.push({ h: nowHour, text: 'now', color: palette.ink2 });

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={(size * SVG_W) / SVG_H}
        height={size}
        viewBox={`${-26 - SIDE} -26 ${SVG_W} ${SVG_H}`}
        style={{ position: 'absolute', left: (-size * SIDE) / SVG_H, top: 0 }}>
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
        {scrub && <Circle cx={scrub[0]} cy={scrub[1]} r={12} fill={palette.accent} stroke={palette.paper} strokeWidth={4} />}
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
        {labels.map((l) => {
          const [x, y] = point(162, l.h);
          const anchor = x > 165 ? 'start' : x < 135 ? 'end' : 'middle';
          return (
            <SvgText key={l.text} x={x} y={y + 4} textAnchor={anchor} fontSize={12} fontWeight="700" fill={l.color}>
              {l.text}
            </SvgText>
          );
        })}
      </Svg>
      <View style={{ position: 'absolute', top: '21%', left: '21%', right: '21%', bottom: '21%', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
      <View {...pan.panHandlers} style={{ position: 'absolute', left: 0, top: 0, width: size, height: size }} />
    </View>
  );
}
