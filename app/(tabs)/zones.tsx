import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import Button from '@/components/Button';
import FormField from '@/components/FormField';
import Screen from '@/components/Screen';
import ZoneMap from '@/components/ZoneMap';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
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

    const zoneCenter =
      shape === 'radius' && center
        ? center
        : polygonCentroid(polygon);

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
    <Screen
      title="Silent zones"
      subtitle="Use the live map to draw a zone or pick a radius from your location.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.cardTitle}>Zone type</Text>
          <View style={styles.shapeRow}>
            <ShapeChip
              label="Radius from location"
              active={shape === 'radius'}
              onPress={() => setShape('radius')}
              palette={palette}
            />
            <ShapeChip
              label="Draw on map"
              active={shape === 'polygon'}
              onPress={() => setShape('polygon')}
              palette={palette}
            />
          </View>
        </View>

        <ZoneMap
          shape={shape}
          radius={radius}
          polygon={polygon}
          onRadiusChange={setRadius}
          onPolygonChange={setPolygon}
          onCenterChange={setCenter}
        />

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.cardTitle}>Save zone</Text>
          <FormField label="Place name" value={name} onChangeText={setName} placeholder="Library, office, gym..." />
          {shape === 'radius' ? (
            <Text style={[styles.meta, { color: palette.muted }]}>
              Current radius: {radius}m {radius < 100 ? '(uses live GPS for small zones)' : '(uses geofencing)'}
            </Text>
          ) : (
            <Text style={[styles.meta, { color: palette.muted }]}>
              {polygon.length} point{polygon.length === 1 ? '' : 's'} drawn
            </Text>
          )}
          <Button title="Save silent zone" onPress={addZone} />
        </View>

        {data.zones.length === 0 ? (
          <Text style={[styles.empty, { color: palette.muted }]}>
            No zones yet. Draw your classroom, office, or a tight 1m bubble around your desk.
          </Text>
        ) : (
          data.zones.map((zone) => (
            <View
              key={zone.id}
              style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={styles.zoneHeader}>
                <View style={styles.zoneText}>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                  <Text style={[styles.meta, { color: palette.muted }]}>
                    {zone.shape === 'polygon'
                      ? `Drawn zone · ${zone.polygon?.length ?? 0} points`
                      : `${zone.radius}m radius`}
                  </Text>
                </View>
                <Switch value={zone.enabled} onValueChange={(value) => toggleZone(zone.id, value)} />
              </View>
              <Button title="Remove zone" variant="danger" onPress={() => removeZone(zone.id)} />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function ShapeChip({
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
        styles.shapeChip,
        {
          backgroundColor: active ? palette.tint : palette.card,
          borderColor: palette.border,
        },
      ]}>
      <Text style={{ color: active ? '#FFF' : palette.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  shapeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shapeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
});
