import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LatLng, RADIUS_PRESETS, ZoneShape } from '@/lib/types';

type Props = {
  shape: ZoneShape;
  radius: number;
  polygon: LatLng[];
  onRadiusChange: (radius: number) => void;
  onPolygonChange: (polygon: LatLng[]) => void;
  onCenterChange: (center: LatLng) => void;
};

export default function ZoneMap({ shape, radius, onRadiusChange, polygon }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <View style={[styles.webFallback, { borderColor: palette.border, backgroundColor: palette.card }]}>
      <Text style={styles.webTitle}>Map preview</Text>
      <Text style={[styles.webBody, { color: palette.muted }]}>
        Live map and zone drawing work on a real device with Expo Go. Use radius presets below and save your zone.
      </Text>
      {shape === 'polygon' ? (
        <Text style={[styles.webBody, { color: palette.muted }]}>
          {polygon.length} point{polygon.length === 1 ? '' : 's'} drawn (device only)
        </Text>
      ) : (
        <View style={styles.presets}>
          {RADIUS_PRESETS.map((preset) => (
            <PresetChip
              key={preset}
              label={`${preset}m`}
              active={radius === preset}
              onPress={() => onRadiusChange(preset)}
              palette={palette}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function PresetChip({
  label,
  active,
  onPress,
  palette,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  palette: (typeof Colors)['light'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? palette.tint : palette.card,
          borderColor: palette.border,
        },
      ]}>
      <Text style={{ color: active ? '#FFF' : palette.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  presets: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  webFallback: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  webTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  webBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});
