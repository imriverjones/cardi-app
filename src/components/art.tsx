import Svg, { Circle, Path, Rect } from 'react-native-svg';

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

export function Outfit({ art, size }: { art: 'coat' | 'jacket' | 'knit' | 'tee'; size?: number }) {
  if (art === 'coat') return <Coat size={size} />;
  if (art === 'jacket') return <Jacket size={size} />;
  if (art === 'knit') return <Knit size={size} />;
  return <Tee size={size} />;
}

/** Small weather icon for a WMO weather code. */
