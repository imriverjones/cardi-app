import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import type { Advice } from '@/engine/advice';
import type { Settings } from '@/engine/types';
import { FONT } from '@/theme/skins';
import { alerts, OUTFIT_SYMBOL } from '@/widgets/sync';

const WHITE = '#FFFFFF';
const SOFT = 'rgba(255,255,255,0.78)';

/** The Lock Screen widget as it will look, drawn with today's real advice. */
export function LockPreview({ a, s, scale = 1 }: { a: Advice; s: Settings; scale?: number }) {
  const al = alerts(a, s, 'morning').slice(0, 2);
  const k = (n: number) => n * scale;
  return (
    <View
      accessible
      accessibilityLabel={`Lock Screen preview: ${a.mine} degrees, ${a.step.short}. ${al.map((x) => x.text).join('. ')}`}
      style={{ backgroundColor: '#2A2530', borderRadius: k(28), paddingVertical: k(18), paddingHorizontal: k(20), alignItems: 'center', gap: k(8), overflow: 'hidden' }}>
      <View style={{ position: 'absolute', top: -k(60), left: -k(40), width: k(220), height: k(220), borderRadius: k(110), backgroundColor: '#F0647A', opacity: 0.32 }} />
      <View style={{ position: 'absolute', bottom: -k(80), right: -k(50), width: k(240), height: k(240), borderRadius: k(120), backgroundColor: '#8FB0E6', opacity: 0.28 }} />
      <Text style={{ fontFamily: FONT.semibold, fontSize: k(13), color: SOFT }}>
        {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
      </Text>
      <Text style={{ fontFamily: FONT.bold, fontSize: k(56), lineHeight: k(60), color: WHITE, letterSpacing: -k(1) }}>9:41</Text>
      <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: k(10) }}>
        <View style={{ flex: 1, minWidth: 0, gap: k(2) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: k(5) }}>
            <SymbolView name={OUTFIT_SYMBOL[a.step.art]} size={k(14)} tintColor={WHITE} />
            <Text numberOfLines={1} style={{ fontFamily: FONT.heavy, fontSize: k(16), color: WHITE }}>{`${a.mine}° ${a.step.short}`}</Text>
          </View>
          {al.map((x) => (
            <View key={x.text} style={{ flexDirection: 'row', alignItems: 'center', gap: k(5) }}>
              <SymbolView name={x.symbol} size={k(11)} tintColor={SOFT} />
              <Text numberOfLines={1} style={{ fontFamily: FONT.semibold, fontSize: k(12.5), color: SOFT }}>
                {x.text}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ width: k(54), height: k(54), borderRadius: k(27), borderWidth: k(4), borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONT.heavy, fontSize: k(17), color: WHITE }}>{`${a.mine}°`}</Text>
        </View>
      </View>
    </View>
  );
}
