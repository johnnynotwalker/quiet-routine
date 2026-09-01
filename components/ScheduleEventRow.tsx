import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import AppSwitch from '@/components/AppSwitch';
import GlassCard from '@/components/GlassCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { spacing, typography } from '@/constants/theme';
import { formatTimeLabel } from '@/lib/time';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  title: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
  icon?: IconName;
  onToggle: (enabled: boolean) => void;
  onRemove?: () => void;
};

export default function ScheduleEventRow({
  title,
  startTime,
  endTime,
  enabled,
  icon = 'radio-button-on-outline',
  onToggle,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <GlassCard compact contentStyle={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: palette.accent }]}>
          <Ionicons name={icon} size={20} color={palette.tint} />
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
});
