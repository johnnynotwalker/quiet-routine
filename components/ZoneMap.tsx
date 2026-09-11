import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Circle, Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import BreathingZoneCircle from '@/components/BreathingZoneCircle';
import Chip from '@/components/Chip';
import ZoneMutePin from '@/components/ZoneMutePin';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { getCurrentCoordinates, watchCurrentLocation } from '@/lib/geofencing';
import { polygonCentroid } from '@/lib/polygon';
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
  /** Only show draft drawing geometry / points while composing */
  drawing?: boolean;
  /** Allow moving zones / editing vertices */
  editMode?: boolean;
  onToggleZoneMute?: (zoneId: string) => void;
  onMoveZone?: (zoneId: string, center: LatLng) => void;
};

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F8FBFF' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748B' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E2E8F0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#DBEAFE' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#EFF6FF' }] },
];

function zonePinCoordinate(zone: SilentZone): LatLng {
  if (zone.shape === 'polygon' && zone.polygon && zone.polygon.length >= 3) {
    return polygonCentroid(zone.polygon);
  }
  return { latitude: zone.latitude, longitude: zone.longitude };
}

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
  drawing = false,
  editMode = false,
  onToggleZoneMute,
  onMoveZone,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const mapRef = useRef<MapView>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [tracksPins, setTracksPins] = useState(true);

  useEffect(() => {
    setTracksPins(true);
    const timer = setTimeout(() => setTracksPins(false), 800);
    return () => clearTimeout(timer);
  }, [savedZones, activeZoneId]);

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
        if (drawing && shape === 'radius') onCenterChange(point);
      });
      subscription = watch;
    })();

    return () => subscription?.remove();
  }, [shape, onCenterChange, drawing]);

  const handleMapPress = (event: { nativeEvent: { coordinate: LatLng } }) => {
    if (!drawing) return;
    const point = event.nativeEvent.coordinate;
    if (shape === 'radius') {
      setCenter(point);
      onCenterChange(point);
      return;
    }
    onPolygonChange([...polygon, point]);
  };

  const showDraft = drawing && !fullBleed ? true : drawing;
  const zoneStroke = palette.tint;
  const zoneFill = 'rgba(56, 189, 248, 0.18)';

  return (
    <View style={[styles.wrapper, fullBleed && styles.wrapperFull]}>
      <MapView
        ref={mapRef}
        style={[styles.map, fullBleed && styles.mapFull]}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={!fullBleed}
        onPress={handleMapPress}
        customMapStyle={LIGHT_MAP_STYLE}>
        {fullBleed
          ? savedZones.map((zone) => {
              if (zone.shape === 'radius') {
                return (
                  <BreathingZoneCircle
                    key={zone.id}
                    center={{ latitude: zone.latitude, longitude: zone.longitude }}
                    radius={Math.max(zone.radius, 1)}
                    strokeColor={zoneStroke}
                    strokeWidth={zone.id === activeZoneId ? 2.5 : 2}
                  />
                );
              }
              if (zone.polygon && zone.polygon.length >= 3) {
                return (
                  <Polygon
                    key={zone.id}
                    coordinates={zone.polygon}
                    strokeColor={zoneStroke}
                    fillColor={zoneFill}
                    strokeWidth={zone.id === activeZoneId ? 2.5 : 2}
                  />
                );
              }
              return null;
            })
          : null}

        {fullBleed
          ? savedZones.map((zone) => {
              const muted = zone.enabled;
              const isCurrent = zone.id === activeZoneId;
              const coordinate = zonePinCoordinate(zone);
              return (
                <Marker
                  key={`pin-${zone.id}`}
                  coordinate={coordinate}
                  anchor={{ x: 0.5, y: 1 }}
                  tracksViewChanges={tracksPins}
                  tappable
                  draggable={editMode && zone.shape === 'radius'}
                  onDragEnd={(event) => {
                    if (!editMode || !onMoveZone) return;
                    onMoveZone(zone.id, event.nativeEvent.coordinate);
                  }}
                  onPress={() => {
                    onToggleZoneMute?.(zone.id);
                  }}>
                  <ZoneMutePin name={zone.name} muted={muted} isCurrent={isCurrent} />
                </Marker>
              );
            })
          : null}

        {showDraft && center && shape === 'radius' ? (
          <>
            {!fullBleed ? <Marker coordinate={center} title="Zone center" /> : null}
            <Circle
              center={center}
              radius={radius}
              strokeColor={palette.tint}
              fillColor="rgba(56, 189, 248, 0.18)"
              strokeWidth={2}
            />
          </>
        ) : null}

        {showDraft && shape === 'polygon' && polygon.length >= 2 ? (
          <Polygon
            coordinates={polygon}
            strokeColor={palette.tint}
            fillColor="rgba(56, 189, 248, 0.18)"
            strokeWidth={2}
          />
        ) : null}
        {showDraft && shape === 'polygon'
          ? polygon.map((point, index) => (
              <Marker key={`${point.latitude}-${point.longitude}-${index}`} coordinate={point} />
            ))
          : null}
      </MapView>

      {!fullBleed && shape === 'radius' ? (
        <View style={[styles.overlay, { backgroundColor: palette.card, borderColor: palette.border }]}>
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
                { borderColor: palette.border, color: palette.text, backgroundColor: palette.card },
              ]}
              keyboardType="numeric"
              placeholder="e.g. 150"
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
        </View>
      ) : !fullBleed ? (
        <View style={[styles.overlay, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.overlayTitle, { color: palette.text }]}>Draw your zone</Text>
          <Text style={[styles.hint, { color: palette.muted }]}>
            Tap points on the map to outline the area. Add at least 3 points.
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={() => onPolygonChange(polygon.slice(0, -1))}
              style={[styles.actionButton, { borderColor: palette.border }]}>
              <Text>Undo</Text>
            </Pressable>
            <Pressable
              onPress={() => onPolygonChange([])}
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
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  overlayTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  presets: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    gap: spacing.sm,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
