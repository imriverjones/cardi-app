import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton, Seg, T } from '@/components/ui';
import { LockPreview } from '@/components/widget-preview';
import { useApp } from '@/state/app-state';

const SNOOZE_DAYS = 3;

const STEPS = {
  lock: [
    'Lock your phone, then press and hold the Lock Screen.',
    'Tap Customise, then Lock Screen.',
    'Tap the box under the clock and choose Cardi.',
    'Add the round one too, for your feels like at a glance.',
  ],
  home: [
    'Press and hold an empty spot on your Home Screen.',
    'Tap Edit in the top corner, then Add Widget.',
    'Search for Cardi and swipe to pick a size.',
    'Tap Add Widget. The medium size shows the most.',
  ],
};

export default function WidgetsScreen() {
  const { advice: a, settings: s, update, palette: p } = useApp();
  const insets = useSafeAreaInsets();
  const [where, setWhere] = useState<'lock' | 'home'>('lock');

  const done = () => {
    update({ widgetAdded: true });
    router.back();
  };
  const later = () => {
    update({ widgetSnoozeUntil: Date.now() + SNOOZE_DAYS * 864e5 });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg2 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 16 }}>
        <View style={{ gap: 6 }}>
          <T w="heavy" size={26} style={{ letterSpacing: -0.6, lineHeight: 30 }}>
            Know what to wear without opening the app
          </T>
          <T size={15} color={p.ink2} style={{ lineHeight: 21 }}>
            Add Cardi to your Lock Screen and you’ll see your feels like, outfit and anything to bring every time you pick up your phone.
          </T>
        </View>

        {a && <LockPreview a={a} s={s} />}

        <Seg
          value={where}
          options={[
            ['lock', 'Lock Screen'],
            ['home', 'Home Screen'],
          ]}
          onChange={setWhere}
        />

        <View style={{ gap: 12 }}>
          {STEPS[where].map((step, i) => (
            <View key={step} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: p.accent, alignItems: 'center', justifyContent: 'center' }}>
                <T w="heavy" size={13} color={p.onAccent}>
                  {i + 1}
                </T>
              </View>
              <T size={15} style={{ flex: 1, lineHeight: 21, paddingTop: 2 }}>
                {step}
              </T>
            </View>
          ))}
        </View>

        <T size={13} color={p.ink3} style={{ lineHeight: 18 }}>
          Can’t see Cardi in the list? Open the app once, then restart your phone. The widget updates itself through the day: your morning outfit, the trip home, then tomorrow.
        </T>
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 14 }}>
        <BigButton kind="soft" label="Later" onPress={later} />
        <BigButton label="Done, it’s on" onPress={done} />
      </View>
    </View>
  );
}
