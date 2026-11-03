import { View } from 'react-native';

import { Box, Row, Seg, T } from '@/components/ui';
import { resolveLegs, type Move } from '@/engine/types';
import { useApp } from '@/state/app-state';

const OPTIONS: [Move, string][] = [
  ['walk', 'Walk'],
  ['cycle', 'Cycle'],
  ['transit', 'Train or bus'],
];

/**
 * How you get to work and home, and what you swap to when it's foul.
 * "Walk in, train home" is just a different pick for each way.
 */
export function CommutePlan() {
  const { settings: s, update, palette: p } = useApp();
  const legs = resolveLegs(s);

  const set = (leg: 'in' | 'home', i: 0 | 1, mode: Move) => {
    const pair: [Move, Move] = [...legs[leg]];
    pair[i] = mode;
    update({ legs: { ...legs, [leg]: pair }, ...(leg === 'in' && i === 0 ? { move: mode } : {}) });
  };

  return (
    <View style={{ gap: 8 }}>
      {(
        [
          ['in', 'Way in'],
          ['home', 'Way home'],
        ] as const
      ).map(([leg, title]) => (
        <View key={leg} style={{ gap: 6 }}>
          <T w="heavy" size={15} style={{ marginTop: 4 }}>
            {title}
          </T>
          <Box>
            <Row>
              <T w="semibold">When it’s nice</T>
              <Seg value={legs[leg][0]} onChange={(m) => set(leg, 0, m)} options={OPTIONS} />
            </Row>
            <Row last>
              <T w="semibold">Wet or cold</T>
              <Seg value={legs[leg][1]} onChange={(m) => set(leg, 1, m)} options={OPTIONS} />
            </Row>
          </Box>
        </View>
      ))}
      <T size={13} color={p.ink3} style={{ paddingHorizontal: 6 }}>
        Cardi suggests your wet-or-cold choice when rain or snow is likely, it’s near freezing or it’s very windy.
      </T>
    </View>
  );
}
