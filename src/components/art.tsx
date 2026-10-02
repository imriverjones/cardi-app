import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

/* Soft, flat illustrations (no outlines), matching the Cardi design canvas. */

type P = { size?: number };

export function Jacket({ size = 90 }: P) {
  return (
    <Svg width={size} height={size * (96 / 90)} viewBox="0 0 90 96">
      <Path d="M20 10 L35 4 L45 12 L55 4 L70 10 L88 32 L80 40 L70 32 L70 92 L20 92 L20 32 L10 40 L2 32 Z" fill="#8DADE0" />
      <Path d="M35 4 L45 26 L45 92 L20 92 L20 32 L10 40 L2 32 L20 10 Z" fill="#7C9DD3" />
      <Path d="M35 4 L45 26 L55 4 Z" fill="#F3E3DD" />
      <Rect x={26} y={44} width={12} height={10} rx={2} fill="#A9C2EA" />
      <Rect x={52} y={44} width={12} height={10} rx={2} fill="#A9C2EA" />
      <Circle cx={49} cy={40} r={1.8} fill="#F6C451" />
      <Circle cx={49} cy={58} r={1.8} fill="#F6C451" />
      <Circle cx={49} cy={76} r={1.8} fill="#F6C451" />
    </Svg>
  );
}

export function Coat({ size = 90 }: P) {
  return (
    <Svg width={size} height={size * (124 / 90)} viewBox="0 0 90 124">
      <Path d="M20 10 L35 4 L45 12 L55 4 L70 10 L88 32 L80 40 L70 32 L73 120 L17 120 L20 32 L10 40 L2 32 Z" fill="#D9A07A" />
      <Path d="M35 4 L45 26 L45 120 L17 120 L20 32 L10 40 L2 32 L20 10 Z" fill="#C98E68" />
      <Path d="M35 4 L45 26 L55 4 Z" fill="#F3E3DD" />
      <Path d="M20 58 H70" stroke="#B57A55" strokeWidth={5} />
      <Circle cx={52} cy={42} r={2.4} fill="#8A5634" />
      <Circle cx={52} cy={80} r={2.4} fill="#8A5634" />
      <Circle cx={52} cy={98} r={2.4} fill="#8A5634" />
    </Svg>
  );
}

export function Knit({ size = 90 }: P) {
  return (
    <Svg width={size} height={size * (92 / 90)} viewBox="0 0 90 92">
      <Path d="M25 8 Q45 16 65 8 L86 24 L78 40 L68 34 L68 88 L22 88 L22 34 L12 40 L4 24 Z" fill="#E9B7A4" />
      <Path d="M34 8 Q45 18 56 8" fill="none" stroke="#D99A84" strokeWidth={5} />
      <Path d="M22 80 H68" stroke="#D99A84" strokeWidth={5} />
    </Svg>
  );
}

export function Tee({ size = 90 }: P) {
  return (
    <Svg width={size} height={size * (92 / 90)} viewBox="0 0 90 92">
      <Path d="M25 8 L38 4 Q45 12 52 4 L65 8 L86 26 L76 38 L66 30 L66 88 L24 88 L24 30 L14 38 L4 26 Z" fill="#FFFFFF" stroke="#E7DCD8" strokeWidth={2} />
      <Path d="M38 4 Q45 12 52 4" fill="none" stroke="#E7C9C9" strokeWidth={3} />
    </Svg>
  );
}

export function Umbrella({ size = 90, color = '#F0647A' }: P & { color?: string }) {
  return (
    <Svg width={size} height={size * (104 / 90)} viewBox="0 0 90 104">
      <Path d="M0 45 A45 45 0 0 1 90 45 Q82 37 75 45 Q67 37 60 45 Q52 37 45 45 Q37 37 30 45 Q22 37 15 45 Q7 37 0 45 Z" fill={color} />
      <Path d="M45 1 L45 45" stroke="rgba(0,0,0,0.15)" strokeWidth={2} />
      <Path d="M45 45 V92 q0 9 -8 9 q-7 0 -7 -7" fill="none" stroke="#8A5A64" strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}

export function Sun({ size = 90 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={24} fill="#F6C451" />
      <G stroke="#F6C451" strokeWidth={6} strokeLinecap="round">
        <Path d="M50 10v8M50 82v8M10 50h8M82 50h8M22 22l6 6M72 72l6 6M22 78l6-6M72 28l6-6" />
      </G>
    </Svg>
  );
}

export function Waves({ size = 24, color = '#9B7BD6' }: P & { color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7c2-2 4 2 6 0s4 2 6 0 4 0 4 0M4 12c2-2 4 2 6 0s4 2 6 0 4 0 4 0M4 17c2-2 4 2 6 0s4 2 6 0 4 0 4 0"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function Clip({ size = 80 }: P) {
  return (
    <Svg width={size} height={size * (46 / 80)} viewBox="0 0 80 46">
      <Rect x={3} y={2} width={74} height={24} rx={12} fill="#C88452" />
      <Circle cx={19} cy={12} r={3.5} fill="#9F5F33" />
      <Circle cx={37} cy={17} r={2.6} fill="#9F5F33" />
      <Circle cx={55} cy={10} r={3} fill="#9F5F33" />
      <Path d="M12 26v13M23 26v15M34 26v16M45 26v16M56 26v15M67 26v13" stroke="#B0703F" strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

export function Shades({ size = 80 }: P) {
  return (
    <Svg width={size} height={size * (34 / 80)} viewBox="0 0 80 34">
      <Rect x={2} y={4} width={32} height={24} rx={10} fill="#3A2E30" />
      <Rect x={46} y={4} width={32} height={24} rx={10} fill="#3A2E30" />
      <Path d="M34 12 q6 -6 12 0" fill="none" stroke="#3A2E30" strokeWidth={4} />
    </Svg>
  );
}

export function Outfit({ art, size }: { art: 'coat' | 'jacket' | 'knit' | 'tee'; size?: number }) {
  if (art === 'coat') return <Coat size={size} />;
  if (art === 'jacket') return <Jacket size={size} />;
  if (art === 'knit') return <Knit size={size} />;
  return <Tee size={size} />;
}

/** Small weather icon for a WMO weather code. */
export function WeatherIcon({ code, rain, size = 30 }: { code: number; rain: number; size?: number }) {
  if (code >= 51 || rain >= 50)
    return (
      <Svg width={size} height={size} viewBox="0 0 36 36">
        <Path d="M9 21h17a5.5 5.5 0 0 0 .5-11A7.5 7.5 0 0 0 11 12a4.5 4.5 0 0 0-2 9z" fill="#C9D9F2" />
        <Path d="M13 25l-1.5 4M19 25l-1.5 4M25 25l-1.5 4" stroke="#7FA6E2" strokeWidth={2.4} strokeLinecap="round" />
      </Svg>
    );
  if (code === 3 || code === 45 || code === 48)
    return (
      <Svg width={size} height={size} viewBox="0 0 36 36">
        <Path d="M8 26h18a6 6 0 0 0 .5-12A8 8 0 0 0 10 16a5 5 0 0 0-2 10z" fill="#D8D2D3" />
      </Svg>
    );
  if (code === 1 || code === 2)
    return (
      <Svg width={size} height={size} viewBox="0 0 36 36">
        <Circle cx={14} cy={14} r={7} fill="#F6C451" />
        <Path d="M12 29h14a5 5 0 0 0 .5-10A7 7 0 0 0 13 20a4.5 4.5 0 0 0-1 9z" fill="#E4DEDF" />
      </Svg>
    );
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Circle cx={18} cy={18} r={8} fill="#F6C451" />
    </Svg>
  );
}
