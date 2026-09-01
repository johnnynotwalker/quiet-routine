import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Circle, Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getCurrentCoordinates, watchCurrentLocation } from '@/lib/geofencing';
import { LatLng, RADIUS_PRESETS, RadiusPreset, ZoneShape } from '@/lib/types';

type Props = {
  shape: ZoneShape;
  radius: number;
  polygon: LatLng[];
  onRadiusChange: (radius: number) => void;
  onPolygonChange: (polygon: LatLng[]) => void;
  onCenterChange: (center: LatLng) => void;
};

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function ZoneMap({
  shape,
  radius,
  polygon,
  onRadiusChange,
  onPolygonChange,
  onCenterChange,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const mapRef = useRef<MapView>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    (async () => {
      const coords = await getCurrentCoordinates();
      if (coords) {
        const point = { latitude: coords.latitude, longitude: coords.longitude };
        setCenter(point);
        onCenterChange(point);
        const nextRegion = {
          ...point,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        };
        setRegion(nextRegion);
        mapRef.current?.animateToRegion(nextRegion, 600);
      }

      const watch = await watchCurrentLocation((liveCoords) => {
        const point = { latitude: liveCoords.latitude, longitude: liveCoords.longitude };
        setCenter(point);
        if (shape === 'radius') onCenterChange(point);
      });
      subscription = watch;
    })();

    return () => subscription?.remove();
  }, [shape, onCenterChange]);

  const handleMapPress = (event: { nativeEvent: { coordinate: LatLng } }) => {
    const point = event.nativeEvent.coordinate;

    if (shape === 'radius') {
      setCenter(point);
      onCenterChange(point);
      return;
    }

    onPolygonChange([...polygon, point]);
  };

  const undoPoint = () => {
    if (polygon.length === 0) return;
    onPolygonChange(polygon.slice(0, -1));
  };

  const clearPolygon = () => onPolygonChange([]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webFallback, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <Text style={styles.webTitle}>Map preview</Text>
        <Text style={[styles.webBody, { color: palette.muted }]}>
          Live map and zone drawing work on a real device with Expo Go. Use radius presets below and save your zone.
        </Text>
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
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        onPress={handleMapPress}>
        {center && shape === 'radius' ? (
          <>
            <Marker coordinate={center} title="Zone center" />
            <Circle
              center={center}
              radius={radius}
              strokeColor={palette.tint}
              fillColor="rgba(91, 95, 199, 0.18)"
              strokeWidth={2}
            />
          </>
        ) : null}
        {shape === 'polygon' && polygon.length >= 2 ? (
          <Polygon
            coordinates={polygon}
            strokeColor={palette.tint}
            fillColor="rgba(91, 95, 199, 0.18)"
            strokeWidth={2}
          />
        ) : null}
        {shape === 'polygon'
          ? polygon.map((point, index) => (
              <Marker key={`${point.latitude}-${point.longitude}-${index}`} coordinate={point} />
            ))
          : null}
      </MapView>

      {shape === 'radius' ? (
        <View style={[styles.overlay, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.overlayTitle}>Silence radius</Text>
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
          <Text style={[styles.hint, { color: palette.muted }]}>
            Tap the map to move the center. Your live location updates the zone automatically.
          </Text>
        </View>
      ) : (
        <View style={[styles.overlay, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.overlayTitle}>Draw your zone</Text>
          <Text style={[styles.hint, { color: palette.muted }]}>
            Tap points on the map to outline the area. Add at least 3 points.
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={undoPoint}
              style={[styles.actionButton, { borderColor: palette.border }]}>
              <Text>Undo point</Text>
            </Pressable>
            <Pressable
              onPress={clearPolygon}
              style={[styles.actionButton, { borderColor: palette.border }]}>
              <Text>Clear</Text>
            </Pressable>
          </View>
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
  wrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D7DBE7',
  },
  map: {
    width: '100%',
    height: 280,
  },
  overlay: {
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  overlayTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
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
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
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
