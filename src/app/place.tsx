import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';

import { T, tap } from '@/components/ui';
import type { Place } from '@/engine/types';
import { useApp } from '@/state/app-state';
import { FONT } from '@/theme/skins';
import { searchPlaces } from '@/weather/forecast';

export default function PlaceScreen() {
  const { update, palette: p, refresh } = useApp();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<(Place & { detail: string })[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (q.trim().length < 2) return setResults([]);
      setBusy(true);
      try {
        setResults(await searchPlaces(q));
      } catch {
        setResults([]);
      }
      setBusy(false);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const choose = (place: Place | null) => {
    tap();
    update({ place });
    router.back();
    if (!place) setTimeout(() => refresh(true), 300);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg2 }} contentContainerStyle={{ padding: 20, gap: 12 }} keyboardShouldPersistTaps="handled">
      <T w="heavy" size={24}>
        Where are you?
      </T>
      <Pressable
        accessibilityRole="button"
        onPress={() => choose(null)}
        style={{ backgroundColor: p.paper, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: p.line }}>
        <T w="bold">Use my current location</T>
        <T size={13} color={p.ink3}>
          Updates as you move around
        </T>
      </Pressable>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search for a town or city"
        placeholderTextColor={p.ink3}
        autoFocus
        autoCorrect={false}
        style={{ backgroundColor: p.paper, borderRadius: 16, padding: 16, fontFamily: FONT.semibold, fontSize: 16, color: p.ink, borderWidth: 1, borderColor: p.line }}
      />
      {busy && <ActivityIndicator color={p.accent} />}
      <View style={{ gap: 6 }}>
        {results.map((r) => (
          <Pressable
            key={`${r.lat},${r.lon}`}
            accessibilityRole="button"
            onPress={() => choose({ name: r.name, lat: r.lat, lon: r.lon })}
            style={{ padding: 14, borderRadius: 14, backgroundColor: p.paper }}>
            <T w="bold">{r.name}</T>
            <T size={13} color={p.ink3}>
              {r.detail}
            </T>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
