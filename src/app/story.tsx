import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Clip, Outfit, Shades, Sun, Umbrella, Waves } from '@/components/art';
import { buildStories, seenStories, type Story } from '@/components/stories';
import { BigButton, T, tap } from '@/components/ui';
import { useApp } from '@/state/app-state';
import type { Palette } from '@/theme/skins';

const DURATION = 6000;

function Art({ story, p, size }: { story: Story; p: Palette; size: number }) {
  const { advice: a, settings: s } = useApp();
  if (!a) return null;
  const blob = (
    <Svg width={size} height={size} viewBox="0 0 350 350" style={{ position: 'absolute' }}>
      <Path d="M60 80 C 120 10, 260 20, 300 110 C 345 210, 290 330, 180 340 C 80 352, 20 290, 30 200 C 36 150, 30 120, 60 80 Z" fill={p.paper} opacity={0.55} />
    </Svg>
  );
  if (story.id === 'outfit')
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {blob}
        <Outfit art={a.step.art} size={size * 0.45} />
        {a.brolly && (
          <View style={{ position: 'absolute', right: size * 0.06, bottom: size * 0.12, transform: [{ rotate: '18deg' }] }}>
            <Umbrella size={size * 0.24} />
          </View>
        )}
        {s.cover.hair && a.frizz >= 4 && a.curly && (
          <View style={{ position: 'absolute', left: size * 0.06, bottom: size * 0.1, transform: [{ rotate: '-12deg' }] }}>
            <Clip size={size * 0.22} />
          </View>
        )}
        {a.uv >= 5 && (
          <View style={{ position: 'absolute', left: size * 0.1, top: size * 0.14, transform: [{ rotate: '-14deg' }] }}>
            <Shades size={size * 0.24} />
          </View>
        )}
      </View>
    );
  if (story.id === 'hair')
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {blob}
        <Waves size={size * 0.5} color="#9B7BD6" />
        <T w="heavy" size={28} color={p.dHair}>{`frizz ${a.frizz}/10`}</T>
      </View>
    );
  if (story.id === 'rain')
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {blob}
        {a.brolly ? <Umbrella size={size * 0.5} /> : <Sun size={size * 0.5} />}
      </View>
    );
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {blob}
      <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Circle cx={50} cy={50} r={40} fill="#F6C451" opacity={0.35} />
      </Svg>
      <T w="black" size={44} color={p.dSun}>{`UV ${a.uv}`}</T>
    </View>
  );
}

export default function StoryScreen() {
  const { advice: a, settings: s, palette: p } = useApp();
  const params = useLocalSearchParams<{ i?: string }>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const stories = a ? buildStories(a, s) : [];
  const [i, setI] = useState(Math.min(Number(params.i ?? 0) || 0, Math.max(0, stories.length - 1)));
  const [progress] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  const story = stories[i];
  const next = () => (i < stories.length - 1 ? setI(i + 1) : router.back());
  const prev = () => i > 0 && setI(i - 1);

  useEffect(() => {
    if (!story || !a) return;
    seenStories.add(`${story.id}-${a.dayKey}`);
    progress.setValue(0);
    if (reduceMotion) return;
    const anim = Animated.timing(progress, { toValue: 1, duration: DURATION, easing: Easing.linear, useNativeDriver: false });
    anim.start(({ finished }) => {
      if (finished) next();
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, reduceMotion]);

  if (!story || !a) return null;

  const bg = { outfit: p.tOther, hair: p.tHair, rain: p.tRain, sun: p.tSun }[story.id];
  const artSize = Math.min(width - 40, height * 0.42);

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 18, paddingHorizontal: 20, gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {stories.map((_, k) => (
          <View key={k} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: p.ink + '29', overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: 3,
                backgroundColor: p.ink,
                width: k < i ? '100%' : k > i ? '0%' : progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T w="bold" size={14}>{`${story.label} · ${i + 1} of ${stories.length}`}</T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => {
            tap();
            router.back();
          }}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: p.paper + 'B3', alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M6 6l12 12M18 6L6 18" stroke={p.ink} strokeWidth={2.6} strokeLinecap="round" />
          </Svg>
        </Pressable>
      </View>

      <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={(e) => (e.nativeEvent.locationX < width / 3 ? prev() : next())} accessibilityHint="Tap the right side for the next story">
        <Art story={story} p={p} size={artSize} />
      </Pressable>

      <View style={{ gap: 10 }}>
        <T w="heavy" size={30} style={{ letterSpacing: -0.8, lineHeight: 33 }}>
          {story.title}
        </T>
        <T size={16} color={p.ink2} style={{ lineHeight: 23 }}>
          {story.body}
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <BigButton kind="soft" label="Back" onPress={prev} disabled={i === 0} />
        <BigButton label={i < stories.length - 1 ? 'Next' : 'Got it'} onPress={next} />
      </View>
    </View>
  );
}
