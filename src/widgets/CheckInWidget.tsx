import { Button, Image, Text, VStack } from '@expo/ui/swift-ui';
import { buttonStyle, containerBackground, font, foregroundStyle, frame, tint } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type CheckInProps = {
  skin: 'blush' | 'stone' | 'night';
  /** Set by the widget's own buttons; the app reads it next time it opens. */
  answer?: 'cold' | 'ok' | 'warm';
  answeredAt?: number;
};

const CheckInWidget = (props: CheckInProps, _env: WidgetEnvironment) => {
  'widget';
  'use no memo';
  const P = {
    blush: { bg: '#FFF7F6', ink: '#221B1C', ink3: '#8E8285', accent: '#F0647A' },
    stone: { bg: '#F7F5F1', ink: '#1E211F', ink3: '#7E837D', accent: '#3E7C63' },
    night: { bg: '#1F1E23', ink: '#F5F1EF', ink3: '#948E8C', accent: '#FF8DA0' },
  }[props.skin];

  if (props.answer) {
    const msg = props.answer === 'cold' ? "Noted. I'll dress you warmer." : props.answer === 'warm' ? "Noted. I'll go lighter." : 'Lovely. Same again.';
    return (
      <VStack alignment="leading" spacing={6} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }), containerBackground(P.bg, 'widget')]}>
        <Image systemName={props.answer === 'cold' ? 'snowflake' : props.answer === 'warm' ? 'sun.max.fill' : 'sparkles'} size={26} color={P.accent} />
        <Text modifiers={[font({ size: 16, weight: 'heavy', design: 'rounded' }), foregroundStyle(P.ink)]}>{msg}</Text>
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(P.ink3)]}>Open Cardi to apply it</Text>
      </VStack>
    );
  }

  const answer = (a: 'cold' | 'ok' | 'warm') => () => ({ ...props, answer: a, answeredAt: Date.now() });
  return (
    <VStack alignment="leading" spacing={6} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' }), containerBackground(P.bg, 'widget')]}>
      <Text modifiers={[font({ size: 14, weight: 'heavy', design: 'rounded' }), foregroundStyle(P.ink)]}>How did today feel?</Text>
      <Button label="Bit chilly" target="cold" onPress={answer('cold')} modifiers={[buttonStyle('bordered'), tint(P.accent), frame({ maxWidth: Infinity })]} />
      <Button label="Spot on" target="ok" onPress={answer('ok')} modifiers={[buttonStyle('borderedProminent'), tint(P.accent), frame({ maxWidth: Infinity })]} />
      <Button label="Too warm" target="warm" onPress={answer('warm')} modifiers={[buttonStyle('bordered'), tint(P.accent), frame({ maxWidth: Infinity })]} />
    </VStack>
  );
};

export default createWidget<CheckInProps>('CheckInWidget', CheckInWidget);
