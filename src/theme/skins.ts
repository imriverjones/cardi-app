import type { Skin } from '@/engine/types';

export type Palette = {
  dark: boolean;
  bg1: string;
  bg2: string;
  paper: string;
  ink: string;
  onInk: string;
  ink2: string;
  ink3: string;
  line: string;
  field: string;
  accent: string;
  accentText: string;
  onAccent: string;
  ring: string;
  day: string;
  rain: string;
  tHair: string;
  dHair: string;
  tLayer: string;
  dLayer: string;
  tSun: string;
  dSun: string;
  tRain: string;
  dRain: string;
  tOther: string;
  dOther: string;
  tGreen: string;
  dGreen: string;
};

export const SKINS: Record<Skin, Palette> = {
  blush: {
    dark: false,
    bg1: '#FFEDEB', bg2: '#FFF7F6', paper: '#FFFFFF', ink: '#221B1C', onInk: '#FFFFFF', ink2: '#5F5356', ink3: '#8E8285',
    line: '#F3E9E8', field: '#F7EEED', accent: '#F0647A', accentText: '#C73E57', onAccent: '#FFFFFF', ring: '#FBE7E5', day: '#F9D0CB', rain: '#8FB0E6',
    tHair: '#EEE4FA', dHair: '#6E4FAE', tLayer: '#FFE8DA', dLayer: '#A8552C', tSun: '#FFF1C9', dSun: '#86650A',
    tRain: '#DDE8F8', dRain: '#3F63A6', tOther: '#FFE3DD', dOther: '#B3374E', tGreen: '#E2F2E4', dGreen: '#2F6B3A',
  },
  stone: {
    dark: false,
    bg1: '#EFEBE4', bg2: '#F7F5F1', paper: '#FFFFFF', ink: '#1E211F', onInk: '#FFFFFF', ink2: '#535953', ink3: '#7E837D',
    line: '#E7E3DC', field: '#F1EEE8', accent: '#3E7C63', accentText: '#2C5E4A', onAccent: '#FFFFFF', ring: '#E9E5DE', day: '#D9D2C4', rain: '#7EA0C8',
    tHair: '#E4E7EE', dHair: '#4A5878', tLayer: '#EFE4D4', dLayer: '#87552A', tSun: '#F2EACD', dSun: '#7A6210',
    tRain: '#DCE5EC', dRain: '#3A5C7E', tOther: '#E5ECE6', dOther: '#2C5E4A', tGreen: '#E1ECE3', dGreen: '#2C5E4A',
  },
  night: {
    dark: true,
    bg1: '#1B1720', bg2: '#141317', paper: '#1F1E23', ink: '#F5F1EF', onInk: '#16151A', ink2: '#C2BBB9', ink3: '#948E8C',
    line: '#2E2C33', field: '#2A2830', accent: '#FF8DA0', accentText: '#FFB3C0', onAccent: '#1A1519', ring: '#2B2930', day: '#4A3A46', rain: '#8FB4F0',
    tHair: '#2C2638', dHair: '#CDB8F5', tLayer: '#35281F', dLayer: '#F5B892', tSun: '#332D1A', dSun: '#F2D27A',
    tRain: '#1F2937', dRain: '#A8C4F0', tOther: '#36242B', dOther: '#FFA9B8', tGreen: '#1F2E24', dGreen: '#9FD8AE',
  },
};

export const SKIN_LIST: { key: Skin; label: string }[] = [
  { key: 'blush', label: 'Blush' },
  { key: 'stone', label: 'Stone' },
  { key: 'night', label: 'Night' },
];

export const FONT = {
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  heavy: 'Figtree_800ExtraBold',
  black: 'Figtree_900Black',
};
