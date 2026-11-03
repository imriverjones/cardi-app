import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, Share, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigButton, T } from '@/components/ui';
import { useApp } from '@/state/app-state';
import { FONT } from '@/theme/skins';
import { track } from '@/analytics';

const SUPPORT_EMAIL = 'cardiapp.help@gmail.com';

/**
 * "Suggest a feature". The idea is emailed from the person's own Mail app, so Cardi never collects
 * or stores what they write. If Mail isn't set up, the share sheet takes over.
 */
export default function SuggestScreen() {
  const { palette: p } = useApp();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const ready = text.trim().length >= 3;

  const send = async () => {
    const message = `${text.trim()}\n\n—\nSent from Cardi ${Constants.expoConfig?.version ?? ''} on ${Platform.OS}`;
    // Only that an idea was sent is counted, never what it says.
    track('feature_suggested');
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Cardi idea')}&body=${encodeURIComponent(message)}`);
      router.back();
    } catch {
      try {
        await Share.share({ message: `To: ${SUPPORT_EMAIL}\nSubject: Cardi idea\n\n${message}` });
        router.back();
      } catch {
        // Cancelled. Their words are still in the box.
      }
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: p.bg2 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 16 }}>
        <View style={{ gap: 6 }}>
          <T w="heavy" size={26} style={{ letterSpacing: -0.6, lineHeight: 30 }}>
            What should Cardi do next?
          </T>
          <T size={15} color={p.ink2} style={{ lineHeight: 21 }}>
            Tell us what would make your mornings easier. Your idea goes to us by email, from your own Mail app, and we read every one.
          </T>
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          maxLength={2000}
          placeholder="e.g. A heads-up for the school run, or when to hang the washing out"
          placeholderTextColor={p.ink3}
          accessibilityLabel="Your idea"
          textAlignVertical="top"
          style={{
            minHeight: 170,
            backgroundColor: p.paper,
            borderWidth: 1.5,
            borderColor: p.line,
            borderRadius: 20,
            padding: 16,
            fontFamily: FONT.medium,
            fontSize: 16,
            lineHeight: 22,
            color: p.ink,
          }}
        />
        <T size={13} color={p.ink3} style={{ lineHeight: 18 }}>
          If we build it, we’ll let you know. You can add your name in the email if you’d like a credit.
        </T>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 14 }}>
        <BigButton kind="soft" label="Not now" onPress={() => router.back()} />
        <BigButton label="Send idea" onPress={send} disabled={!ready} />
      </View>
    </KeyboardAvoidingView>
  );
}
