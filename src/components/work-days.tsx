import { Pressable, View } from 'react-native';

import { T, tap } from '@/components/ui';
import { useApp } from '@/state/app-state';

// Monday first, as a UK week reads. Values are 0 = Sunday … 6 = Saturday.
const DAYS: [number, string, string][] = [
  [1, 'M', 'Monday'],
  [2, 'T', 'Tuesday'],
  [3, 'W', 'Wednesday'],
  [4, 'T', 'Thursday'],
  [5, 'F', 'Friday'],
  [6, 'S', 'Saturday'],
  [0, 'S', 'Sunday'],
];

/** Seven round toggles for the days you commute. Other days are planned as days off. */
export function WorkDays() {
  const { settings: s, update, palette: p } = useApp();
  const on = s.workDays ?? [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
      {DAYS.map(([d, short, name]) => {
        const sel = on.includes(d);
        return (
          <Pressable
            key={d}
            accessibilityRole="checkbox"
            accessibilityLabel={name}
            accessibilityState={{ checked: sel }}
            onPress={() => {
              tap();
              update({ workDays: sel ? on.filter((x) => x !== d) : [...on, d].sort() });
            }}
            style={{
              flex: 1,
              aspectRatio: 1,
              maxWidth: 44,
              borderRadius: 99,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: sel ? p.ink : p.paper,
              borderWidth: 1,
              borderColor: sel ? p.ink : p.line,
            }}>
            <T w="bold" size={14} color={sel ? p.onInk : p.ink}>
              {short}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
