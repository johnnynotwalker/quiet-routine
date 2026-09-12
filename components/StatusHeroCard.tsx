import { Volume2, VolumeX } from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';

import Button from '@/components/Button';
import GlassCard from '@/components/GlassCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { spacing, typography } from '@/constants/theme';
import { SilenceState } from '@/lib/types';

type Props = {
  silence: SilenceState;
  zoneLabel?: string;
  timeRange?: string;
  onPrimaryAction: () => void;
  primaryLabel: string;
  onFocusAction?: () => void;
};

export default function StatusHeroCard({
  silence,
  zoneLabel,
  timeRange,
  onPrimaryAction,
  primaryLabel,
  onFocusAction,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const Icon = silence.isSilenced ? VolumeX : Volume2;

  const detail = (() => {
    if (!silence.isSilenced || !silence.reason) return 'Tap below when you need quiet focus';
    switch (silence.reason.type) {
      case 'zone': {
        const name = zoneLabel ?? silence.reason.zoneName;
        return timeRange ? `${name} · ${timeRange}` : name;
      }
      case 'meeting':
        return timeRange ? `${silence.reason.title} · ${timeRange}` : silence.reason.title;
      case 'manual':
        return silence.reason.label ?? 'Manual silence';
    }
  })();

  return (
    <GlassCard highlighted={silence.isSilenced} contentStyle={styles.card}>
      <View style={styles.top}>
        <View style={[styles.iconBubble, { backgroundColor: palette.iceTint }]}>
          <Icon size={26} color={palette.tint} strokeWidth={1.75} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: palette.text }]}>
            {silence.isSilenced ? 'Currently Silenced' : 'Not Silenced'}
          </Text>
          <Text style={[styles.detail, { color: palette.muted }]}>{detail}</Text>
        </View>
      </View>
      <Button title={primaryLabel} onPress={onPrimaryAction} style={styles.cta} />
      {Platform.OS === 'ios' && onFocusAction ? (
        <Button title="Turn on Do Not Disturb now" variant="secondary" onPress={onFocusAction} />
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xl,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.heading,
    fontSize: 22,
  },
  detail: {
    ...typography.body,
    fontSize: 14,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
