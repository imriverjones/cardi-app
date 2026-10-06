import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { T } from '@/components/ui';
import type { Forecast } from '@/engine/types';
import { useApp } from '@/state/app-state';

import { CardiNative, type AppleAttribution } from '../../modules/cardi-native';

const APPLE_LEGAL = 'https://weatherkit.apple.com/legal-attribution.html';
let cached: AppleAttribution | null = null;

/** Apple asks for its Weather mark and a link to its data sources wherever its data appears. */
export function WeatherCredit({ forecast }: { forecast: Forecast }) {
  const { palette: p } = useApp();
  const [attr, setAttr] = useState<AppleAttribution | null>(cached);
  const apple = forecast.source === 'apple';

  useEffect(() => {
    if (!apple || cached || !CardiNative) return;
    CardiNative.attributionAsync()
      .then((a) => {
        cached = a;
        setAttr(a);
      })
      .catch(() => {});
  }, [apple]);

  const updated = new Date(forecast.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  if (!apple) {
    return (
      <T size={11} color={p.ink3} style={{ textAlign: 'center' }}>
        Weather data by Open-Meteo.com · updated {updated}
      </T>
    );
  }
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      {attr ? (
        <Image
          source={{ uri: p.dark ? attr.markDarkURL : attr.markLightURL }}
          style={{ width: 88, height: 14 }}
          contentFit="contain"
          accessibilityLabel={attr.serviceName}
        />
      ) : (
        <T size={11} w="semibold" color={p.ink3}>
          {''} Weather
        </T>
      )}
      <Pressable accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(attr?.legalPageURL ?? APPLE_LEGAL).catch(() => {})} hitSlop={8}>
        <T size={11} color={p.ink3} style={{ textDecorationLine: 'underline' }}>
          Data sources · updated {updated}
        </T>
      </Pressable>
    </View>
  );
}
