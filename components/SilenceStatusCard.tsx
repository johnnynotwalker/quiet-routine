import { StyleSheet, View } from 'react-native';

import Colors from '@/constants/Colors';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { SilenceState } from '@/lib/types';

type Props = {
  silence: SilenceState;
};

export default function SilenceStatusCard({ silence }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const reasonLabel = (() => {
    if (!silence.isSilenced || !silence.reason) {
      return 'QuietRoutine is monitoring zones and your calendar';
    }
    switch (silence.reason.type) {
      case 'zone':
        return `Should be silent in ${silence.reason.zoneName}`;
      case 'meeting':
        return `Should be silent for ${silence.reason.title}`;
      case 'manual':
        return silence.reason.label ?? 'Reminder mode — switch to silent yourself';
    }
  })();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: silence.isSilenced ? palette.accent : palette.card,
          borderColor: silence.isSilenced ? palette.tint : palette.border,
        },
      ]}>
      <View style={styles.row}>
        <View
          style={[
            styles.dot,
            { backgroundColor: silence.isSilenced ? palette.tint : palette.success },
          ]}
        />
        <Text style={styles.title}>
          {silence.isSilenced ? 'Silence mode active' : 'Not in silence mode'}
        </Text>
      </View>
      <Text style={[styles.subtitle, { color: palette.muted }]}>{reasonLabel}</Text>
      <Text style={[styles.note, { color: palette.muted }]}>
        QuietRoutine tracks when you should be quiet. In Expo Go it cannot flip the physical ringer switch.
      </Text>
      {silence.until ? (
        <Text style={[styles.until, { color: palette.muted }]}>
          Until {new Date(silence.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  until: {
    fontSize: 14,
  },
  note: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
});
