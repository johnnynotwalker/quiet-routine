import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Circle, Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import PulsingMarker from '@/components/PulsingMarker';
import Chip from '@/components/Chip';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getCurrentCoordinates, watchCurrentLocation } from '@/lib/geofencing';
import { LatLng, RADIUS_PRESETS, SilentZone, ZoneShape } from '@/lib/types';
import { radius as radii, spacing } from '@/constants/theme';

type Props = {
  shape: ZoneShape;
  radius: number;
  polygon: LatLng[];
  onRadiusChange: (radius: number) => void;
  onPolygonChange: (polygon: LatLng[]) => void;
  onCenterChange: (center: LatLng) => void;
  fullBleed?: boolean;
  savedZones?: SilentZone[];
  activeZoneId?: string | null;
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
  fullBleed = false,
  savedZones = [],
  activeZoneId = null,
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

  return (
    <View style={[styles.wrapper, fullBleed && styles.wrapperFull]}>
      <MapView
        ref={mapRef}
        style={[styles.map, fullBleed && styles.mapFull]}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        onPress={handleMapPress}>
        {fullBleed
          ? savedZones.map((zone) => {
              const isActive = zone.id === activeZoneId;
              const stroke = isActive ? palette.tint : '#94A3B8';
              const fill = isActive ? 'rgba(56, 189, 248, 0.22)' : 'rgba(148, 163, 184, 0.14)';
              if (zone.shape === 'radius') {
                return (
                  <Circle
                    key={zone.id}
                    center={{ latitude: zone.latitude, longitude: zone.longitude }}
                    radius={zone.radius}
                    strokeColor={stroke}
                    fillColor={fill}
                    strokeWidth={isActive ? 2 : 1}
                  />
                );
              }
              if (zone.polygon && zone.polygon.length >= 3) {
                return (
                  <Polygon
                    key={zone.id}
                    coordinates={zone.polygon}
                    strokeColor={stroke}
                    fillColor={fill}
                    strokeWidth={isActive ? 2 : 1}
                  />
                );
              }
              return null;
            })
          : null}
        {fullBleed
          ? savedZones.map((zone) => (
              <Marker
                key={`marker-${zone.id}`}
                coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}>
                <PulsingMarker active={zone.id === activeZoneId} />
              </Marker>
            ))
          : null}
        {center && shape === 'radius' ? (
          <>
            <Marker coordinate={center} title="Zone center" />
            <Circle
              center={center}
              radius={radius}
              strokeColor={palette.tint}
              fillColor="rgba(56, 189, 248, 0.18)"
              strokeWidth={2}
            />
          </>
        ) : null}
        {shape === 'polygon' && polygon.length >= 2 ? (
          <Polygon
            coordinates={polygon}
            strokeColor={palette.tint}
            fillColor="rgba(56, 189, 248, 0.18)"
            strokeWidth={2}
          />
        ) : null}
        {shape === 'polygon'
          ? polygon.map((point, index) => (
              <Marker key={`${point.latitude}-${point.longitude}-${index}`} coordinate={point} />
            ))
          : null}
      </MapView>

      {!fullBleed && shape === 'radius' ? (
        <View style={[styles.overlay, { backgroundColor: palette.glass, borderColor: palette.border }]}>
          <Text style={[styles.overlayTitle, { color: palette.text }]}>Silence radius</Text>
          <View style={styles.presets}>
            {RADIUS_PRESETS.map((preset) => (
              <Chip
                key={preset}
                label={`${preset}m`}
                active={radius === preset}
                onPress={() => onRadiusChange(preset)}
              />
            ))}
          </View>
          <View style={styles.customRow}>
            <Text style={[styles.customLabel, { color: palette.muted }]}>Custom</Text>
            <TextInput
              style={[
                styles.customInput,
                { borderColor: palette.border, color: palette.text, backgroundColor: palette.glass },
              ]}
              keyboardType="numeric"
              placeholder="e.g. 25"
              placeholderTextColor={palette.muted}
              value={RADIUS_PRESETS.includes(radius as (typeof RADIUS_PRESETS)[number]) ? '' : String(radius)}
              onChangeText={(text) => {
                const parsed = Number(text.replace(/[^0-9]/g, ''));
                if (!text.trim()) return;
                if (Number.isFinite(parsed) && parsed > 0) {
                  onRadiusChange(Math.min(parsed, 10_000));
                }
              }}
            />
            <Text style={[styles.customLabel, { color: palette.muted }]}>meters</Text>
          </View>
          <Text style={[styles.hint, { color: palette.muted }]}>
            Tap the map to move the center. Your live location updates the zone automatically.
          </Text>
        </View>
      ) : !fullBleed ? (
        <View style={[styles.overlay, { backgroundColor: palette.glass, borderColor: palette.border }]}>
          <Text style={[styles.overlayTitle, { color: palette.text }]}>Draw your zone</Text>
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
  },
  wrapperFull: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
  },
  map: {
    width: '100%',
    height: 280,
  },
  mapFull: {
    flex: 1,
    height: undefined,
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
    flexWrap: 'wrap',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
    fontSize: 15,
    fontWeight: '600',
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
});
