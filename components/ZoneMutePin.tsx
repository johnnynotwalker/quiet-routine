import { VolumeX } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors, { tokens } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { radius, shadow, spacing } from '@/constants/theme';

type Props = {
  name: string;
  /** Zone is muted/armed → red pin; unmuted → gray */
  muted?: boolean;
  /** Currently silencing because you are inside this zone */
  isCurrent?: boolean;
};

/** Custom map pin: mute icon + zone name. Name stays the zone name (never becomes "Current"). */
export default function ZoneMutePin({ name, muted = false, isCurrent = false }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const pinColor = muted ? tokens.mutePin : '#94A3B8';

  return (
    <View style={styles.wrap} collapsable={false}>
      <View
        style={[styles.pill, shadow.soft, { backgroundColor: palette.card, borderColor: palette.border }]}
        collapsable={false}>
        {isCurrent ? <View style={[styles.liveDot, { backgroundColor: palette.tint }]} /> : null}
        <Text style={[styles.label, { color: palette.text }]} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={[styles.caret, { borderTopColor: palette.card }]} />
      <View
        style={[styles.pin, shadow.soft, { backgroundColor: pinColor, borderColor: '#FFFFFF' }]}
        collapsable={false}>
        <VolumeX size={14} color="#FFFFFF" strokeWidth={2.2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: 148,
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
    marginTop: -1,
  },
  pin: {
    marginTop: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
