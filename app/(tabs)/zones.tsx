import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';

import Button from '@/components/Button';
import FormField from '@/components/FormField';
import Screen from '@/components/Screen';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '@/context/AppContext';
import { getCurrentCoordinates } from '@/lib/geofencing';
import { createId } from '@/lib/time';
import { SilentZone } from '@/lib/types';

export default function ZonesScreen() {
  const { data, setZones } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [name, setName] = useState('');
  const [radius, setRadius] = useState('150');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const useCurrentLocation = async () => {
    const coords = await getCurrentCoordinates();
    if (!coords) {
      Alert.alert('Location unavailable', 'Allow location access to use your current position.');
      return;
    }
    setLatitude(coords.latitude.toFixed(6));
    setLongitude(coords.longitude.toFixed(6));
  };

  const addZone = async () => {
    if (!name.trim() || !latitude || !longitude) {
      Alert.alert('Missing details', 'Add a name and location for this silent zone.');
      return;
    }

    const zone: SilentZone = {
      id: createId('zone'),
      name: name.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: Math.max(50, Number(radius) || 150),
      enabled: true,
    };

    await setZones([...data.zones, zone]);
    setName('');
    setRadius('150');
    setLatitude('');
    setLongitude('');
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
      subtitle="Define places where your phone should stay quiet automatically.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.cardTitle}>Add a zone</Text>
          <FormField label="Place name" value={name} onChangeText={setName} placeholder="Library, office, gym..." />
          <FormField
            label="Radius (meters)"
            value={radius}
            onChangeText={setRadius}
            keyboardType="numeric"
            placeholder="150"
          />
          <FormField
            label="Latitude"
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numbers-and-punctuation"
            placeholder="37.774929"
          />
          <FormField
            label="Longitude"
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numbers-and-punctuation"
            placeholder="-122.419416"
          />
          <Button title="Use current location" variant="secondary" onPress={useCurrentLocation} />
          <Button title="Save silent zone" onPress={addZone} />
        </View>

        {data.zones.length === 0 ? (
          <Text style={[styles.empty, { color: palette.muted }]}>
            No zones yet. Add your office, classroom, or any place where you want automatic silence.
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
                    {zone.radius}m radius · {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
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
