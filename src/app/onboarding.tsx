import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Outfit, Waves } from '@/components/art';
import { BIAS_OPTIONS, COVER_OPTIONS, Option, SkinPicker, TimeStepper } from '@/components/settings-parts';
import { BigButton, Box, Row, Seg, T, tap, Wordmark } from '@/components/ui';
import { useApp } from '@/state/app-state';
import { FONT } from '@/theme/skins';

type StepId = 'welcome' | 'name' | 'cover' | 'wear' | 'hair' | 'day' | 'feel' | 'location' | 'look';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function WelcomeRing({ size }: { size: number }) {
  const { palette: p } = useApp();
  const [draw] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(draw, { toValue: 1, duration: 1400, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [draw]);
  const C = 2 * Math.PI * 130;
  const dash = (len: number) => draw.interpolate({ inputRange: [0, 1], outputRange: [`0 ${C}`, `${len} ${C}`] });
  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 300 300">
        <Circle cx={150} cy={150} r={130} fill={p.paper} />
        <Circle cx={150} cy={150} r={130} fill="none" stroke={p.ring} strokeWidth={20} />
        <AnimatedCircle cx={150} cy={150} r={130} fill="none" stroke={p.day} strokeWidth={20} strokeDasharray={dash(408)} strokeDashoffset={-34} rotation={-90} origin="150,150" />
        <AnimatedCircle cx={150} cy={150} r={130} fill="none" stroke={p.accent} strokeWidth={20} strokeLinecap="round" strokeDasharray={dash(22)} strokeDashoffset={-74} rotation={-90} origin="150,150" />
        <AnimatedCircle cx={150} cy={150} r={130} fill="none" stroke={p.accent} strokeWidth={20} strokeLinecap="round" strokeDasharray={dash(22)} strokeDashoffset={-397} rotation={-90} origin="150,150" />
      </Svg>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <T w="bold" size={12} color={p.ink3}>
          Feels like for you
        </T>
        <T w="black" size={52} style={{ letterSpacing: -2, lineHeight: 56 }}>
          7°
        </T>
        <T w="bold" size={12} color={p.ink3}>
          Jacket day
        </T>
      </View>
    </View>
  );
}

function Feature({ icon, bg, title, sub }: { icon: React.ReactNode; bg: string; title: string; sub: string }) {
  const { palette: p } = useApp();
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <T w="heavy" size={16}>
          {title}
        </T>
        <T size={14.5} color={p.ink2}>
          {sub}
        </T>
      </View>
    </View>
  );
}

function Q({ children }: { children: string }) {
  const { width } = useWindowDimensions();
  return (
    <T w="black" size={Math.min(34, width * 0.085)} style={{ letterSpacing: -1.2, lineHeight: Math.min(36, width * 0.09) }}>
      {children}
    </T>
  );
}

function Why({ children }: { children: string }) {
  const { palette: p } = useApp();
  return (
    <T size={15} color={p.ink2} style={{ lineHeight: 21 }}>
      {children}
    </T>
  );
}

export default function Onboarding() {
  const { settings: s, update, palette: p, refresh } = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const [locState, setLocState] = useState<'idle' | 'granted' | 'denied'>('idle');

  const steps: StepId[] = ['welcome', 'name', 'cover', ...(s.cover.outfit ? (['wear'] as StepId[]) : []), ...(s.cover.hair ? (['hair'] as StepId[]) : []), 'day', 'feel', 'location', 'look'];
  const idx = Math.min(i, steps.length - 1);
  const step = steps[idx];
  const last = idx === steps.length - 1;
  const canGo = step !== 'cover' || Object.values(s.cover).some(Boolean);

  const next = () => {
    if (!last) return setI(idx + 1);
    update({ onboarded: true });
    setTimeout(() => refresh(true), 100);
    router.replace('/');
  };

  const askLocation = async () => {
    tap();
    const r = await Location.requestForegroundPermissionsAsync().catch(() => null);
    setLocState(r?.granted ? 'granted' : 'denied');
    if (r?.granted) update({ place: null });
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg2, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 38 }}>
        {idx > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => {
              tap();
              setI(idx - 1);
            }}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: p.paper, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M15 5l-7 7 7 7" stroke={p.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        ) : (
          <View style={{ width: 38 }} />
        )}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {steps.map((_, k) => (
            <View key={k} style={{ height: 7, width: k === idx ? 20 : 7, borderRadius: 4, backgroundColor: k === idx ? p.accent : p.line }} />
          ))}
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        {step === 'welcome' && (
          <View style={{ gap: 22 }}>
            <View style={{ alignItems: 'center' }}>
              <Wordmark size={30} />
            </View>
            <WelcomeRing size={Math.min(210, width * 0.55)} />
            <T w="black" size={Math.min(36, width * 0.09)} style={{ textAlign: 'center', letterSpacing: -1.4, lineHeight: Math.min(38, width * 0.095) }}>
              Know what to wear before you leave the house.
            </T>
            <View style={{ gap: 16, paddingHorizontal: 4 }}>
              <Feature
                bg={p.tOther}
                title="Your own feels like"
                sub="Learns whether you run hot or cold."
                icon={
                  <Svg width={24} height={24} viewBox="0 0 24 24">
                    <Path d="M14 14.8V4.5a2 2 0 0 0-4 0v10.3a4 4 0 1 0 4 0z" stroke={p.dOther} strokeWidth={2.2} fill="none" strokeLinecap="round" />
                  </Svg>
                }
              />
              <Feature bg={p.tLayer} title="Dressed for your whole day" sub="Ready for the walk home, not just 8am." icon={<Outfit art="jacket" size={24} />} />
              <Feature bg={p.tHair} title="Hair, rain and SPF" sub="Know what to bring before you go." icon={<Waves size={24} />} />
            </View>
          </View>
        )}

        {step === 'name' && (
          <>
            <Q>What should we call you?</Q>
            <TextInput
              value={s.name}
              onChangeText={(name) => update({ name: name.slice(0, 20) })}
              placeholder="Your first name"
              placeholderTextColor={p.ink3}
              autoFocus
              autoComplete="given-name"
              returnKeyType="next"
              onSubmitEditing={next}
              style={{ borderWidth: 2, borderColor: p.line, backgroundColor: p.paper, borderRadius: 18, padding: 16, fontFamily: FONT.bold, fontSize: 20, color: p.ink }}
            />
            <Why>Optional. It’s just for the morning hello.</Why>
          </>
        )}

        {step === 'cover' && (
          <>
            <Q>What should Cardi cover?</Q>
            <Why>Pick as many as you like.</Why>
            {COVER_OPTIONS.map((o) => (
              <Option key={o.key} title={o.title} sub={o.sub} on={s.cover[o.key]} onPress={() => update({ cover: { ...s.cover, [o.key]: !s.cover[o.key] } })} />
            ))}
          </>
        )}

        {step === 'wear' && (
          <>
            <Q>What do you usually wear?</Q>
            <Why>So outfit tips use the right words for you.</Why>
            <Option title="Trousers & jeans" sub="Jumpers, overshirts, coats" on={s.wear === 'trousers'} onPress={() => update({ wear: 'trousers' })} />
            <Option title="Dresses & skirts" sub="Knits, tights, bare legs" on={s.wear === 'dresses'} onPress={() => update({ wear: 'dresses' })} />
            <Option title="A mix of everything" on={s.wear === 'mix'} onPress={() => update({ wear: 'mix' })} />
          </>
        )}

        {step === 'hair' && (
          <>
            <Q>Tell us about your hair</Q>
            <Why>The same air can be a great day for one hair type and a disaster for another.</Why>
            <Option title="Curly" sub="Frizz is the enemy" on={s.hair === 'curly'} onPress={() => update({ hair: 'curly' })} />
            <Option title="Wavy" sub="Somewhere in between" on={s.hair === 'wavy'} onPress={() => update({ hair: 'wavy' })} />
            <Option title="Straight" sub="Watch out for flat days" on={s.hair === 'straight'} onPress={() => update({ hair: 'straight' })} />
            <Option title="Short or low-fuss" sub="Just warn me about wind" on={s.hair === 'short'} onPress={() => update({ hair: 'short' })} />
          </>
        )}

        {step === 'day' && (
          <>
            <Q>When are you out and about?</Q>
            <Why>Cardi dresses you for these hours, not just right now.</Why>
            <Box>
              <Row>
                <T w="semibold">Leave home</T>
                <TimeStepper label="leave time" value={s.leave} onChange={(leave) => update({ leave: Math.min(leave, s.back - 0.5) })} />
              </Row>
              <Row last>
                <T w="semibold">Head home</T>
                <TimeStepper label="home time" value={s.back} onChange={(back) => update({ back: Math.max(back, s.leave + 0.5) })} />
              </Row>
            </Box>
            {s.cover.commute && (
              <>
                <T w="heavy" style={{ marginTop: 6 }}>
                  How do you get about?
                </T>
                <Seg value={s.move} onChange={(move) => update({ move })} options={[['walk', 'Walking'], ['cycle', 'Cycling'], ['transit', 'Bus or train']]} />
              </>
            )}
          </>
        )}

        {step === 'feel' && (
          <>
            <Q>Do you run hot or cold?</Q>
            <Why>This sets your personal feels like. Cardi keeps fine-tuning it from your “bit chilly” and “too warm” taps.</Why>
            {BIAS_OPTIONS.map((b) => (
              <Option key={b.v} title={b.title} sub={b.sub} on={s.bias === b.v} onPress={() => update({ bias: b.v })} />
            ))}
          </>
        )}

        {step === 'location' && (
          <>
            <Q>Where’s your weather?</Q>
            <Why>Cardi uses your location for the forecast. It’s only used to get the weather.</Why>
            <Option
              title={locState === 'granted' ? 'Location is on' : 'Use my location'}
              sub={locState === 'denied' ? 'Location was turned off. You can pick a city instead.' : 'Recommended'}
              on={locState === 'granted'}
              onPress={askLocation}
            />
            <Option title={s.place ? `City: ${s.place.name}` : 'Pick a city instead'} sub="Good if you'd rather not share location" on={!!s.place} onPress={() => router.push('/place')} />
          </>
        )}

        {step === 'look' && (
          <>
            <Q>Last thing: pick your look</Q>
            <Why>You can change this any time in Me.</Why>
            <SkinPicker />
          </>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row' }}>
        <BigButton label={idx === 0 ? 'Get started' : last ? 'Show me today' : 'Continue'} onPress={next} disabled={!canGo} />
      </View>
      {idx === 0 && (
        <T size={13} color={p.ink3} style={{ textAlign: 'center', marginTop: 8 }}>
          Takes about 30 seconds
        </T>
      )}
    </View>
  );
}
