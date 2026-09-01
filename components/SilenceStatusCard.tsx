import { StyleSheet, View } from 'react-native';

import GlassCard from '@/components/GlassCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { spacing, typography } from '@/constants/theme';
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
    <GlassCard highlighted={silence.isSilenced} contentStyle={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.dot,
            { backgroundColor: silence.isSilenced ? palette.tint : palette.switchOff },
          ]}
        />
        <Text style={[styles.title, { color: palette.text }]}>
          {silence.isSilenced ? 'Silence mode active' : 'Not in silence mode'}
        </Text>
      </View>
      <Text style={[styles.subtitle, { color: palette.muted }]}>{reasonLabel}</Text>
      {silence.until ? (
        <Text style={[styles.until, { color: palette.muted }]}>
          Until {new Date(silence.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  title: {
    ...typography.title,
    fontSize: 20,
  },
  subtitle: {
    ...typography.body,
  },
  until: {
    ...typography.caption,
  },
});
