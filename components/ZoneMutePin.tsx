import { VolumeX } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors, { tokens } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { radius, shadow, spacing } from '@/constants/theme';

type Props = {
  name: string;
  active?: boolean;
  showCurrentPrefix?: boolean;
};

/** Custom map pin: mute icon + zone name pill (solid — no blur over maps). */
export default function ZoneMutePin({ name, active = false, showCurrentPrefix = false }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const label = showCurrentPrefix && active ? `Current: ${name}` : name;

  return (
    <View style={styles.wrap}>
      <View style={[styles.pill, shadow.soft, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {active ? <View style={[styles.liveDot, { backgroundColor: palette.tint }]} /> : null}
        <Text style={[styles.label, { color: palette.text }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.caret} />
      <View
        style={[
          styles.pin,
          shadow.soft,
          { backgroundColor: active ? tokens.mutePin : '#94A3B8', borderColor: '#FFFFFF' },
        ]}>
        <VolumeX size={14} color="#FFFFFF" strokeWidth={2.2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 160,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: 160,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginTop: -1,
  },
  pin: {
    marginTop: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
