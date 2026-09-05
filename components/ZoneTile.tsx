import { Briefcase, Home, MapPinned } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import GlassCard from '@/components/GlassCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { spacing, typography } from '@/constants/theme';
import { SilentZone } from '@/lib/types';
import { tapHaptic } from '@/lib/haptics';

type Props = {
  zone: SilentZone;
  active: boolean;
  onPress?: () => void;
};

function zoneIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('office') || lower.includes('work')) return Briefcase;
  if (lower.includes('home')) return Home;
  return MapPinned;
}

export default function ZoneTile({ zone, active, onPress }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const Icon = zoneIcon(zone.name);

  return (
    <Pressable
      style={styles.wrap}
      onPress={() => {
        tapHaptic().catch(() => undefined);
        onPress?.();
      }}>
      <GlassCard compact highlighted={active} contentStyle={styles.card}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: active ? palette.iceTint : 'rgba(148,163,184,0.12)' },
          ]}>
          <Icon size={22} color={active ? palette.tint : palette.muted} strokeWidth={1.75} />
        </View>
        <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
          {zone.name}
        </Text>
        <View style={styles.statusRow}>
          <View
            style={[styles.dot, { backgroundColor: active ? palette.success : palette.switchOff }]}
          />
          <Text style={[styles.status, { color: active ? palette.success : palette.muted }]}>
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
    minHeight: 128,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
