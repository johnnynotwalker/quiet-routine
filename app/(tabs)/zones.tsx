import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import AppSwitch from '@/components/AppSwitch';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import FormField from '@/components/FormField';
import GlassCard from '@/components/GlassCard';
import Screen from '@/components/Screen';
import ZoneMap from '@/components/ZoneMap';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { spacing, typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { polygonCentroid } from '@/lib/polygon';
import { createId } from '@/lib/time';
import { LatLng, RADIUS_PRESETS, SilentZone, ZoneShape } from '@/lib/types';

export default function ZonesScreen() {
  const { data, setZones } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [name, setName] = useState('');
  const [shape, setShape] = useState<ZoneShape>('radius');
  const [radius, setRadius] = useState<number>(RADIUS_PRESETS[2]);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [polygon, setPolygon] = useState<LatLng[]>([]);

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
      Alert.alert('Incomplete zone', 'Draw at least 3 points on the map to outline your silent area.');
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
  };

  const toggleZone = async (zoneId: string, enabled: boolean) => {
    await setZones(data.zones.map((zone) => (zone.id === zoneId ? { ...zone, enabled } : zone)));
  };

  const removeZone = async (zoneId: string) => {
    await setZones(data.zones.filter((zone) => zone.id !== zoneId));
  };

  return (
    <Screen title="Silent zones" subtitle="Draw a bubble on the map or set a custom radius.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GlassCard contentStyle={styles.card}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Zone type</Text>
          <View style={styles.shapeRow}>
            <Chip label="Radius" active={shape === 'radius'} onPress={() => setShape('radius')} />
            <Chip label="Draw on map" active={shape === 'polygon'} onPress={() => setShape('polygon')} />
          </View>
        </GlassCard>

        <ZoneMap
          shape={shape}
          radius={radius}
          polygon={polygon}
          onRadiusChange={setRadius}
          onPolygonChange={setPolygon}
          onCenterChange={setCenter}
        />

        <GlassCard contentStyle={styles.card}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Save zone</Text>
          <FormField label="Place name" value={name} onChangeText={setName} placeholder="Library, office, gym..." />
          {shape === 'radius' ? (
            <Text style={[styles.meta, { color: palette.muted }]}>
              Current radius: {radius}m {radius < 100 ? '(live GPS)' : '(geofencing)'}
            </Text>
          ) : (
            <Text style={[styles.meta, { color: palette.muted }]}>
              {polygon.length} point{polygon.length === 1 ? '' : 's'} drawn
            </Text>
          )}
          <Button title="Save silent zone" onPress={addZone} />
        </GlassCard>

        {data.zones.length === 0 ? (
          <Text style={[styles.empty, { color: palette.muted }]}>
            No zones yet. Draw your classroom, office, or a tight bubble around your desk.
          </Text>
        ) : (
          data.zones.map((zone) => (
            <GlassCard key={zone.id} contentStyle={styles.card}>
              <View style={styles.zoneHeader}>
                <View style={styles.zoneText}>
                  <Text style={[styles.zoneName, { color: palette.text }]}>{zone.name}</Text>
                  <Text style={[styles.meta, { color: palette.muted }]}>
                    {zone.shape === 'polygon'
                      ? `Drawn zone · ${zone.polygon?.length ?? 0} points`
                      : `${zone.radius}m radius`}
                  </Text>
                </View>
                <AppSwitch value={zone.enabled} onValueChange={(value) => toggleZone(zone.id, value)} />
              </View>
              <Button title="Remove zone" variant="danger" onPress={() => removeZone(zone.id)} />
            </GlassCard>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 120,
  },
  card: {
    gap: spacing.md,
  },
  cardTitle: {
    ...typography.heading,
  },
  shapeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  zoneText: {
    flex: 1,
    gap: 4,
  },
  zoneName: {
    fontSize: 17,
    fontWeight: '700',
  },
  meta: {
    ...typography.caption,
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
