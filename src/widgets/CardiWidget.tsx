import { Gauge, HStack, Image, Label, Spacer, Text, VStack, ZStack, RoundedRectangle } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  gaugeStyle,
  lineLimit,
  minimumScaleFactor,
  padding,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { SFSymbol } from 'sf-symbols-typescript';

export type Tone = 'other' | 'rain' | 'hair' | 'sun' | 'green' | 'layer';

export type CardiWidgetProps = {
  skin: 'blush' | 'stone' | 'night';
  mode: 'morning' | 'home' | 'tomorrow';
  /** Small label at the top, e.g. "Morning · London" */
  label: string;
  /** Personal feels like for the moment this entry covers */
  feels: number;
  /** Real air temperature at that moment */
  actual: number;
  /** "9°" or, when the day warms up a lot, "9–17°" */
  range: string;
  /** "way out" or "way home": which trip the number is for */
  when: string;
  lo: number;
  hi: number;
  /** "Jacket day" */
  verdict: string;
  /** Large widget title, two lines */
  headline: string;
  headline2: string;
  /** What to act on, most important first (max 3). Each is a few words with an SF Symbol. */
  alerts: { symbol: SFSymbol; tone: Tone; text: string; sub?: string }[];
  /** Outfit in a word or two, e.g. "T-shirt" */
  short: string;
  /** Big SF Symbol for the outfit, shown on the large widget */
  outfitSymbol: SFSymbol;
  /** Four tiles on the large widget */
  tiles: { tone: Tone; title: string; value: string }[];
  /** One line for the Lock Screen above the clock */
  inline: string;
  /** SF Symbol shown before the inline line */
  inlineSymbol: SFSymbol;
  /** Hair score 0-10, or -1 when hair is switched off */
  frizz: number;
  hairLabel: string;
};

const CardiWidget = (props: CardiWidgetProps, env: WidgetEnvironment) => {
  'widget';
  'use no memo';
  // Everything the layout needs must live inside this function (it runs in the widget's own runtime).

  // Added before setup is finished: no forecast yet, so point people to the app instead of showing a blank widget.
  if (!props || !props.alerts) {
    const f = env.widgetFamily;
    const open = widgetURL('cardi://?from=widget&size=setup');
    if (f === 'accessoryInline') return <Text modifiers={[open]}>Open Cardi to set up</Text>;
    if (f === 'accessoryCircular')
      return (
        <VStack spacing={2} modifiers={[open]}>
          <Image systemName="tshirt.fill" size={16} />
          <Text modifiers={[font({ size: 11, weight: 'semibold' })]}>Cardi</Text>
        </VStack>
      );
    if (f === 'accessoryRectangular')
      return (
        <VStack alignment="leading" spacing={1} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' }), open]}>
          <Text modifiers={[font({ size: 16, weight: 'heavy', design: 'rounded' })]}>Cardi</Text>
          <Text modifiers={[font({ size: 13, weight: 'semibold' }), lineLimit(2)]}>Open the app to set up your forecast</Text>
        </VStack>
      );
    return (
      <VStack alignment="leading" spacing={6} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }), containerBackground('#FFF7F6', 'widget'), open]}>
        <Text modifiers={[font({ size: 22, weight: 'black', design: 'rounded' }), foregroundStyle('#221B1C')]}>cardi</Text>
        <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle('#5F5356')]}>Open Cardi to finish setup, then your outfit shows here.</Text>
      </VStack>
    );
  }
  const P = {
    blush: { bg: '#FFF7F6', bg2: '#FFE6E1', ink: '#221B1C', ink2: '#5F5356', ink3: '#8E8285', accent: '#F0647A', accentText: '#B3374E', chip: '#FFFFFF' },
    stone: { bg: '#F7F5F1', bg2: '#EFE4D4', ink: '#1E211F', ink2: '#535953', ink3: '#7E837D', accent: '#3E7C63', accentText: '#2C5E4A', chip: '#FFFFFF' },
    night: { bg: '#1F1E23', bg2: '#2B2930', ink: '#F5F1EF', ink2: '#C2BBB9', ink3: '#948E8C', accent: '#FF8DA0', accentText: '#FFA9B8', chip: '#2A2830' },
  }[props.skin];
  const T = {
    blush: {
      other: ['#FFE3DD', '#B3374E', '#F0647A'], rain: ['#DDE8F8', '#3F63A6', '#8FB0E6'], hair: ['#EEE4FA', '#6E4FAE', '#9B7BD6'],
      sun: ['#FFF1C9', '#86650A', '#F6C451'], green: ['#E2F2E4', '#2F6B3A', '#5DB36B'], layer: ['#FFE8DA', '#A8552C', '#E8906A'],
    },
    stone: {
      other: ['#E5ECE6', '#2C5E4A', '#3E7C63'], rain: ['#DCE5EC', '#3A5C7E', '#7EA0C8'], hair: ['#E4E7EE', '#4A5878', '#6E7EA3'],
      sun: ['#F2EACD', '#7A6210', '#E0B23E'], green: ['#E1ECE3', '#2C5E4A', '#3E7C63'], layer: ['#EFE4D4', '#87552A', '#C98E68'],
    },
    night: {
      other: ['#36242B', '#FFA9B8', '#FF8DA0'], rain: ['#1F2937', '#A8C4F0', '#8FB4F0'], hair: ['#2C2638', '#CDB8F5', '#B49AEB'],
      sun: ['#332D1A', '#F2D27A', '#F6C451'], green: ['#1F2E24', '#9FD8AE', '#6CC383'], layer: ['#35281F', '#F5B892', '#E8906A'],
    },
  }[props.skin];
  const fam = env.widgetFamily;
  const fullColor = env.widgetRenderingMode == null || env.widgetRenderingMode === 'fullColor';
  const bg = containerBackground(P.bg, 'widget');
  const link = widgetURL(`cardi://?from=widget&size=${fam}`);

  /* ---------- Lock Screen ---------- */
  if (fam === 'accessoryInline') {
    return <Label title={props.inline} systemImage={props.inlineSymbol} modifiers={[link]} />;
  }
  if (fam === 'accessoryCircular') {
    // Gauge label slots do not render in widgets, so the number sits on top of a bare ring.
    return (
      <ZStack modifiers={[link]}>
        <Gauge
          value={Math.min(props.hi, Math.max(props.lo, props.feels))}
          min={props.lo}
          max={props.hi === props.lo ? props.lo + 1 : props.hi}
          modifiers={[gaugeStyle('circular')]}
        />
        <VStack spacing={-1}>
          <Text modifiers={[font({ size: 20, weight: 'bold', design: 'rounded' }), minimumScaleFactor(0.6), lineLimit(1)]}>{`${props.feels}°`}</Text>
          <Text modifiers={[font({ size: 10, weight: 'semibold' })]}>feels</Text>
        </VStack>
      </ZStack>
    );
  }
  if (fam === 'accessoryRectangular') {
    // Lock Screen box: the verdict, then the two things worth acting on.
    return (
      <VStack alignment="leading" spacing={1} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' }), link]}>
        <Text modifiers={[font({ size: 16, weight: 'heavy', design: 'rounded' }), lineLimit(1), minimumScaleFactor(0.75)]}>{`${props.verdict} · ${props.range}`}</Text>
        {props.alerts.slice(0, 2).map((al, i) => (
          <Text key={i} modifiers={[font({ size: 13, weight: 'semibold' }), lineLimit(1), minimumScaleFactor(0.8)]}>
            {al.text}
          </Text>
        ))}
      </VStack>
    );
  }

  /* ---------- Small ---------- */
  if (fam === 'systemSmall') {
    // Also what StandBy shows at night: big number, verdict, one line.
    const top = props.alerts[0];
    return (
      <VStack
        alignment="leading"
        spacing={0}
        modifiers={[
          frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }),
          containerBackground(
            fullColor ? { type: 'linearGradient', colors: [P.bg, P.bg2], startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } } : P.bg,
            'widget'
          ),
          link,
        ]}>
        <Text modifiers={[font({ size: 13, weight: 'bold', design: 'rounded' }), foregroundStyle(P.accentText), lineLimit(1), minimumScaleFactor(0.8)]}>
          {props.label}
        </Text>
        <Spacer />
        <Text modifiers={[font({ size: 60, weight: 'black', design: 'rounded' }), foregroundStyle(P.accent), minimumScaleFactor(0.6), lineLimit(1)]}>
          {`${props.feels}°`}
        </Text>
        <Spacer />
        <Text modifiers={[font({ size: 20, weight: 'heavy', design: 'rounded' }), foregroundStyle(P.ink), lineLimit(1), minimumScaleFactor(0.7)]}>
          {props.verdict}
        </Text>
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(P.ink3), lineLimit(1), minimumScaleFactor(0.8)]}>
          {top ? top.text : `${props.actual}° actual`}
        </Text>
      </VStack>
    );
  }

  /* ---------- Medium ---------- */
  if (fam === 'systemMedium') {
    return (
      <HStack spacing={16} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity }), bg, link]}>
        <VStack alignment="leading" spacing={2} modifiers={[frame({ width: 112, alignment: 'leading' })]}>
          <Text modifiers={[font({ size: 11, weight: 'heavy' }), foregroundStyle(P.accentText), lineLimit(1), minimumScaleFactor(0.7)]}>
            {props.label.toUpperCase()}
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: 50, weight: 'heavy', design: 'rounded' }), foregroundStyle(P.ink), lineLimit(1), minimumScaleFactor(0.6)]}>
            {`${props.feels}°`}
          </Text>
          {props.mode !== 'morning' && <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(P.ink3)]}>feels like for you</Text>}
          <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(P.ink3), lineLimit(1), minimumScaleFactor(0.8)]}>
            {`${props.actual}° actual · ${props.when}`}
          </Text>
        </VStack>
        <VStack alignment="leading" spacing={7} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
          <Text modifiers={[font({ size: 20, weight: 'heavy', design: 'rounded' }), foregroundStyle(P.ink), lineLimit(1), minimumScaleFactor(0.7)]}>
            {props.verdict}
          </Text>
          {props.alerts.slice(0, 3).map((al, i) => (
            <HStack key={i} spacing={7}>
              <Image systemName={al.symbol} size={12} color={T[al.tone][2]} modifiers={[frame({ width: 16 })]} />
              <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(P.ink2), lineLimit(1), minimumScaleFactor(0.8)]}>
                {al.text}
              </Text>
            </HStack>
          ))}
        </VStack>
      </HStack>
    );
  }

  /* ---------- Large ---------- */
  return (
    <VStack alignment="leading" spacing={12} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'topLeading' }), bg, link]}>
      <HStack alignment="top">
        <VStack alignment="leading" spacing={3}>
          <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(P.ink3)]}>{props.label}</Text>
          <Text modifiers={[font({ size: 26, weight: 'heavy', design: 'rounded' }), foregroundStyle(P.ink), lineLimit(1), minimumScaleFactor(0.7)]}>
            {props.headline}
          </Text>
          <Text modifiers={[font({ size: 26, weight: 'heavy', design: 'rounded' }), foregroundStyle(P.accent), lineLimit(1), minimumScaleFactor(0.7)]}>
            {props.headline2}
          </Text>
        </VStack>
        <Spacer />
        <VStack alignment="trailing" spacing={0}>
          <Text modifiers={[font({ size: 44, weight: 'heavy', design: 'rounded' }), foregroundStyle(P.ink)]}>{`${props.feels}°`}</Text>
          <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(P.ink3)]}>feels, for you</Text>
          <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(P.ink3)]}>{`${props.actual}° actual`}</Text>
        </VStack>
      </HStack>

      <ZStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
        <RoundedRectangle cornerRadius={20} modifiers={[foregroundStyle(T.other[0])]} />
        <HStack spacing={18}>
          <Image systemName={props.outfitSymbol} size={64} color={T.layer[2]} />
          {props.alerts.slice(0, 3).map((al, i) => (
            <Image key={i} systemName={al.symbol} size={30} color={T[al.tone][2]} />
          ))}
        </HStack>
      </ZStack>

      <VStack spacing={8}>
        {[0, 2].map((row) => (
          <HStack key={row} spacing={8}>
            {props.tiles.slice(row, row + 2).map((tile, i) => (
              <ZStack key={i} alignment="leading" modifiers={[frame({ maxWidth: Infinity, height: 48 })]}>
                <RoundedRectangle cornerRadius={14} modifiers={[foregroundStyle(T[tile.tone][0])]} />
                <VStack alignment="leading" spacing={1} modifiers={[padding({ horizontal: 11 })]}>
                  <Text modifiers={[font({ size: 10, weight: 'heavy' }), foregroundStyle(T[tile.tone][1])]}>{tile.title.toUpperCase()}</Text>
                  <Text modifiers={[font({ size: 14, weight: 'heavy' }), foregroundStyle(P.ink), lineLimit(1), minimumScaleFactor(0.75)]}>{tile.value}</Text>
                </VStack>
              </ZStack>
            ))}
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};

export default createWidget<CardiWidgetProps>('CardiWidget', CardiWidget);
