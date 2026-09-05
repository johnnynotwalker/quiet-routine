import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Clock, MapPin, type LucideIcon } from 'lucide-react-native';

import Button from '@/components/Button';
import Chip from '@/components/Chip';
import FormField from '@/components/FormField';
import GlassBottomSheet from '@/components/GlassBottomSheet';
import Screen from '@/components/Screen';
import ZoneMap from '@/components/ZoneMap';
import { Text } from '@/components/Themed';
import Colors, { type ThemeColors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '@/context/AppContext';
import { polygonCentroid } from '@/lib/polygon';
import { createId } from '@/lib/time';
import { spacing, typography } from '@/constants/theme';
import { LatLng, RADIUS_PRESETS, SilentZone, ZoneShape } from '@/lib/types';

function SheetStat({
  icon: Icon,
  label,
  accent,
  palette,
}: {
  icon?: LucideIcon;
  label: string;
  accent?: string;
  palette: ThemeColors;
}) {
  const color = accent ?? palette.muted;
  return (
    <View style={styles.stat}>
      {Icon ? <Icon size={14} color={color} strokeWidth={1.75} /> : (
        <View style={[styles.dot, { backgroundColor: color }]} />
      )}
      <Text style={[styles.statText, { color }]}>{label}</Text>
    </View>
  );
}

export default function ZonesScreen() {
  const { data, setZones } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [name, setName] = useState('');
  const [shape, setShape] = useState<ZoneShape>('radius');
  const [radius, setRadius] = useState<number>(RADIUS_PRESETS[2]);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [polygon, setPolygon] = useState<LatLng[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);

  const activeZoneId =
    data.silence.reason?.type === 'zone' ? data.silence.reason.zoneId : null;

  const activeZone = useMemo(() => {
    if (activeZoneId) {
      return data.zones.find((zone) => zone.id === activeZoneId);
    }
    return data.zones.find((zone) => zone.enabled) ?? data.zones[0];
  }, [activeZoneId, data.zones]);

  const addZone = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Give this silent zone a name.');
      return;
    }
    if (shape === 'radius' && !center) {
      Alert.alert('Missing location', 'Allow location access or tap the map to set a center point.');
      return;
    }
    if (shape === 'polygon' && polygon.length < 3) {
      Alert.alert('Incomplete zone', 'Draw at least 3 points on the map.');
      return;
    }

    const zoneCenter = shape === 'radius' && center ? center : polygonCentroid(polygon);
    const zone: SilentZone = {
      id: createId('zone'),
      name: name.trim(),
      shape,
      latitude: zoneCenter.latitude,
      longitude: zoneCenter.longitude,
      radius: shape === 'radius' ? radius : 0,
      polygon: shape === 'polygon' ? polygon : undefined,
      enabled: true,
    };

    await setZones([...data.zones, zone]);
    setName('');
    setPolygon([]);
    setRadius(RADIUS_PRESETS[2]);
    setComposerOpen(false);
  };

  return (
    <Screen title="Zones">
      <View style={styles.mapArea}>
        <ZoneMap
          shape={shape}
          radius={radius}
          polygon={polygon}
          onRadiusChange={setRadius}
          onPolygonChange={setPolygon}
          onCenterChange={setCenter}
          fullBleed
          savedZones={data.zones}
          activeZoneId={activeZoneId}
        />

        <GlassBottomSheet>
          {composerOpen ? (
            <>
              <Text style={[styles.sheetTitle, { color: palette.text }]}>New zone</Text>
              <View style={styles.shapeRow}>
                <Chip label="Radius" active={shape === 'radius'} onPress={() => setShape('radius')} />
                <Chip label="Draw" active={shape === 'polygon'} onPress={() => setShape('polygon')} />
              </View>
              <FormField label="Place name" value={name} onChangeText={setName} placeholder="Work, home..." />
              {shape === 'radius' ? (
                <View style={styles.shapeRow}>
                  {RADIUS_PRESETS.map((preset) => (
                    <Chip
                      key={preset}
                      label={`${preset}m`}
                      active={radius === preset}
                      onPress={() => setRadius(preset)}
                    />
                  ))}
                </View>
              ) : null}
              <Button title="Save zone" onPress={addZone} />
              <Button title="Cancel" variant="secondary" onPress={() => setComposerOpen(false)} />
            </>
          ) : (
            <>
              <Text style={[styles.sheetTitle, { color: palette.text }]}>
                {activeZone?.name ?? 'No zones yet'}
              </Text>
              {activeZone ? (
                <View style={styles.statsRow}>
                  <SheetStat
                    label={activeZone.enabled ? 'Active' : 'Inactive'}
                    accent={activeZone.enabled ? palette.success : palette.muted}
                    palette={palette}
                  />
                  <SheetStat
                    icon={MapPin}
                    label={
                      activeZone.shape === 'polygon'
                        ? `${activeZone.polygon?.length ?? 0} pts`
                        : `${activeZone.radius}m`
                    }
                    palette={palette}
                  />
                  <SheetStat icon={Clock} label="Strict" palette={palette} />
                </View>
              ) : (
                <Text style={[styles.sheetMeta, { color: palette.muted }]}>
                  Add a zone to auto-silence by location
                </Text>
              )}
              <Button title="Add New Zone" onPress={() => setComposerOpen(true)} />
            </>
          )}
        </GlassBottomSheet>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapArea: {
    flex: 1,
    marginHorizontal: -spacing.screen,
    marginBottom: -spacing.lg,
  },
  sheetTitle: {
    ...typography.heading,
    fontSize: 20,
    fontWeight: '700',
  },
  sheetMeta: {
    ...typography.body,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
  shapeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
