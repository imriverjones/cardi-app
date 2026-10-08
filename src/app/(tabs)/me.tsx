import { router } from 'expo-router';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BIAS_OPTIONS, COVER_OPTIONS, SkinPicker, TimeStepper } from '@/components/settings-parts';
import { BigButton, Box, Row, Seg, T, tap } from '@/components/ui';
import { askToNotify } from '@/notify/morning';
import { useApp } from '@/state/app-state';
import { FONT } from '@/theme/skins';
import { track } from '@/analytics';

export default function Me() {
  const { settings: s, update, palette: p, forecast } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.bg2 }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110, paddingHorizontal: 20, gap: 10 }}
      keyboardShouldPersistTaps="handled">
      <T w="heavy" size={27} style={{ letterSpacing: -0.5, marginBottom: 6 }}>
        About you
      </T>

      <Box>
        <Row>
          <T w="semibold">Your name</T>
          <TextInput
            value={s.name}
            onChangeText={(name) => update({ name: name.slice(0, 20) })}
            placeholder="First name"
            placeholderTextColor={p.ink3}
            autoComplete="given-name"
            style={{ minWidth: 150, backgroundColor: p.field, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontFamily: FONT.semibold, fontSize: 15, color: p.ink }}
          />
        </Row>
        <Row>
          <T w="semibold">Location</T>
          <Pressable accessibilityRole="button" onPress={() => router.push('/place')}>
            <T w="bold" color={p.accentText}>
              {s.place ? s.place.name : `Current location${forecast ? ` (${forecast.place})` : ''}`} ›
            </T>
          </Pressable>
        </Row>
        <Row>
          <T w="semibold">Leave home</T>
          <TimeStepper label="leave time" value={s.leave} onChange={(leave) => update({ leave: Math.min(leave, s.back - 0.5) })} />
        </Row>
        <Row last>
          <T w="semibold">Head home</T>
          <TimeStepper label="home time" value={s.back} onChange={(back) => update({ back: Math.max(back, s.leave + 0.5) })} />
        </Row>
      </Box>
      <T size={13} color={p.ink3} style={{ paddingHorizontal: 6 }}>
        Your feels like covers the hours you’re actually outside, not just right now.
      </T>

      <T w="heavy" size={17} style={{ marginTop: 14 }}>
        Cardi covers
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {COVER_OPTIONS.map((o) => {
          const on = s.cover[o.key];
          return (
            <Pressable
              key={o.key}
              accessibilityRole="switch"
              accessibilityState={{ checked: on }}
              onPress={() => {
                tap();
                const next = { ...s.cover, [o.key]: !on };
                if (!Object.values(next).some(Boolean)) next.outfit = true;
                update({ cover: next });
              }}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 99, backgroundColor: on ? p.ink : p.paper, borderWidth: 1, borderColor: on ? p.ink : p.line }}>
              <T w="bold" size={14} color={on ? p.onInk : p.ink}>
                {o.title}
              </T>
            </Pressable>
          );
        })}
      </View>

      <Box style={{ marginTop: 10 }}>
        <Row>
          <T w="semibold">You usually wear</T>
          <Seg value={s.wear} onChange={(wear) => update({ wear })} options={[['trousers', 'Trousers & jeans'], ['dresses', 'Dresses & skirts'], ['mix', 'A mix']]} />
        </Row>
        <Row>
          <T w="semibold">Your hair</T>
          <Seg value={s.hair} onChange={(hair) => update({ hair })} options={[['curly', 'Curly'], ['wavy', 'Wavy'], ['straight', 'Straight'], ['short', 'Short']]} />
        </Row>
        <Row last>
          <T w="semibold">You get about by</T>
          <Seg value={s.move} onChange={(move) => update({ move })} options={[['walk', 'Walking'], ['cycle', 'Cycling'], ['transit', 'Bus or train']]} />
        </Row>
      </Box>

      <T w="heavy" size={17} style={{ marginTop: 14 }}>
        You usually feel
      </T>
      <Seg
        value={String(s.bias)}
        onChange={(v) => update({ bias: Number(v) })}
        options={BIAS_OPTIONS.map((b) => [String(b.v), b.v === 3 ? 'Always cold' : b.v === -3 ? 'Always warm' : b.v === 1 ? 'Bit cold' : b.v === -1 ? 'Bit warm' : 'Average'])}
      />
      <T size={13} color={p.ink3} style={{ paddingHorizontal: 6 }}>
        Your “bit chilly” and “too warm” taps adjust this for you over time.
      </T>

      <T w="heavy" size={17} style={{ marginTop: 14 }}>
        Morning heads-up
      </T>
      <Box>
        <Row last={!s.notify}>
          <T w="semibold">Notification</T>
          <Seg
            value={s.notify ? 'on' : 'off'}
            options={[
              ['on', 'On'],
              ['off', 'Off'],
            ]}
            onChange={async (v) => {
              if (v === 'off') {
                track('notify_changed', { on: false });
                return update({ notify: false });
              }
              const ok = await askToNotify();
              track('notify_changed', { on: ok, allowed: ok });
              update({ notify: ok });
            }}
          />
        </Row>
        {s.notify && (
          <Row last>
            <T w="semibold">Send it at</T>
            <TimeStepper label="notification time" value={s.notifyAt} onChange={(notifyAt) => update({ notifyAt })} />
          </Row>
        )}
      </Box>
      <T size={13} color={p.ink3} style={{ paddingHorizontal: 6 }}>
        One line each morning: your feels like, the outfit, and anything to bring. If it won’t turn on, allow notifications in Settings › Cardi.
      </T>

      <T w="heavy" size={17} style={{ marginTop: 14 }}>
        Look
      </T>
      <SkinPicker />

      <Box style={{ marginTop: 14 }}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/widgets')}>
          <Row last>
            <T w="semibold">Lock Screen & Home Screen widgets</T>
            <T w="bold" color={p.accentText}>
              How to add ›
            </T>
          </Row>
        </Pressable>
      </Box>

      <View style={{ flexDirection: 'row', marginTop: 22 }}>
        <BigButton
          label="Run setup again"
          onPress={() => {
            tap();
            router.push('/onboarding');
          }}
        />
      </View>
    </ScrollView>
  );
}
