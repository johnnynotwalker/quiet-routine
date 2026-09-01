import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import GlassCard from '@/components/GlassCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { spacing, typography } from '@/constants/theme';
import { SilentZone } from '@/lib/types';
import { tapHaptic } from '@/lib/haptics';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  zone: SilentZone;
  active: boolean;
  onPress?: () => void;
};

function zoneIcon(name: string, shape: SilentZone['shape']): IconName {
  const lower = name.toLowerCase();
  if (lower.includes('office') || lower.includes('work')) return 'briefcase-outline';
  if (lower.includes('home')) return 'home-outline';
  return shape === 'polygon' ? 'map-outline' : 'location-outline';
}

export default function ZoneTile({ zone, active, onPress }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const icon = zoneIcon(zone.name, zone.shape);

  return (
    <Pressable
      style={styles.wrap}
      onPress={() => {
        tapHaptic().catch(() => undefined);
        onPress?.();
      }}>
      <GlassCard
        compact
        highlighted={active}
        contentStyle={styles.card}
        style={active ? styles.activeCard : undefined}>
        <View style={[styles.iconCircle, { backgroundColor: active ? palette.accent : 'rgba(148,163,184,0.12)' }]}>
          <Ionicons name={icon} size={22} color={active ? palette.tint : palette.muted} />
        </View>
        <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
          {zone.name}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: active ? '#34D399' : palette.switchOff }]} />
          <Text style={[styles.status, { color: active ? '#34D399' : palette.muted }]}>
            {active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    gap: spacing.sm,
  },
  activeCard: {},
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.label,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
});
