import { Crosshair, Moon, Sun } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import AppSwitch from '@/components/AppSwitch';
import GlassCard from '@/components/GlassCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { spacing, typography } from '@/constants/theme';
import { formatTimeLabel } from '@/lib/time';

type Props = {
  title: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

function eventIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('focus')) return Crosshair;
  if (lower.includes('quiet') || lower.includes('evening') || lower.includes('night')) return Moon;
  return Sun;
}

export default function ScheduleEventRow({
  title,
  startTime,
  endTime,
  enabled,
  onToggle,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const Icon = eventIcon(title);

  return (
    <GlassCard compact contentStyle={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: palette.iceTint }]}>
          <Icon size={20} color={palette.tint} strokeWidth={1.75} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.time, { color: palette.muted }]}>
            {formatTimeLabel(startTime)} – {formatTimeLabel(endTime)}
          </Text>
        </View>
        <AppSwitch value={enabled} onValueChange={onToggle} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.label,
    fontSize: 16,
  },
  time: {
    ...typography.caption,
    letterSpacing: 0,
  },
});
