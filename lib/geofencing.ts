import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { haversineDistanceMeters, isPointInPolygon } from './polygon';
import { loadAppData, updateSilence } from './storage';
import { applySilenceState, buildSilenceState } from './silence';
import { LatLng, SilentZone } from './types';

export const GEOFENCE_TASK = 'QUIETROUTINE_GEOFENCE';
export const LOCATION_WATCH_TASK = 'QUIETROUTINE_LOCATION_WATCH';

const NATIVE_GEOFENCE_MIN_RADIUS = 100;

function isInsideZone(zone: SilentZone, point: LatLng): boolean {
  if (zone.shape === 'polygon' && zone.polygon && zone.polygon.length >= 3) {
    return isPointInPolygon(point, zone.polygon);
  }

  return haversineDistanceMeters(point, { latitude: zone.latitude, longitude: zone.longitude }) <= zone.radius;
}

async function applyZoneSilence(zone: SilentZone): Promise<void> {
  const appData = await loadAppData();
  if (
    appData.silence.isSilenced &&
    appData.silence.reason?.type === 'zone' &&
    appData.silence.reason.zoneId === zone.id
  ) {
    return;
  }

  const silence = buildSilenceState(true, {
    type: 'zone',
    zoneName: zone.name,
    zoneId: zone.id,
  });
  await updateSilence(silence);
  await applySilenceState(silence);
}

async function clearZoneSilence(zoneId: string): Promise<void> {
  const appData = await loadAppData();
  if (appData.silence.reason?.type !== 'zone' || appData.silence.reason.zoneId !== zoneId) {
    return;
  }

  const silence = buildSilenceState(false, null);
  await updateSilence(silence);
  await applySilenceState(silence);
}

async function evaluateLocationAgainstZones(coords: LatLng): Promise<void> {
  const appData = await loadAppData();
  const enabledZones = appData.zones.filter((zone) => zone.enabled);
  const matchedZone = enabledZones.find((zone) => isInsideZone(zone, coords));

  if (matchedZone) {
    await applyZoneSilence(matchedZone);
    return;
  }

  if (appData.silence.reason?.type === 'zone') {
    await clearZoneSilence(appData.silence.reason.zoneId);
  }
}

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Geofence task error:', error);
    return;
  }

  const event = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };

  const appData = await loadAppData();
  const zone = appData.zones.find((item) => item.id === event.region.identifier);
  if (!zone || !zone.enabled) return;

  if (event.eventType === Location.GeofencingEventType.Enter) {
    await applyZoneSilence(zone);
    return;
  }

  if (event.eventType === Location.GeofencingEventType.Exit) {
    await clearZoneSilence(zone.id);
  }
});

TaskManager.defineTask(LOCATION_WATCH_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Location watch task error:', error);
    return;
  }

  const locations = (data as { locations?: Location.LocationObject[] }).locations;
  const latest = locations?.[locations.length - 1];
  if (!latest) return;

  await evaluateLocationAgainstZones({
    latitude: latest.coords.latitude,
    longitude: latest.coords.longitude,
  });
});

export function toLocationRegion(zone: SilentZone): Location.LocationRegion {
  return {
    identifier: zone.id,
    latitude: zone.latitude,
    longitude: zone.longitude,
    radius: Math.max(zone.radius, NATIVE_GEOFENCE_MIN_RADIUS),
    notifyOnEnter: true,
    notifyOnExit: true,
  };
}

export async function requestLocationPermissions(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return false;

  const background = await Location.requestBackgroundPermissionsAsync();
  return background.granted;
}

function needsLocationWatch(zones: SilentZone[]): boolean {
  return zones.some(
    (zone) =>
      zone.enabled &&
      (zone.shape === 'polygon' || (zone.shape === 'radius' && zone.radius < NATIVE_GEOFENCE_MIN_RADIUS))
  );
}

function geofenceEligibleZones(zones: SilentZone[]): SilentZone[] {
  return zones.filter(
    (zone) => zone.enabled && zone.shape === 'radius' && zone.radius >= NATIVE_GEOFENCE_MIN_RADIUS
  );
}

export async function syncGeofencing(zones: SilentZone[]): Promise<void> {
  const enabledZones = zones.filter((zone) => zone.enabled);
  const geofenceZones = geofenceEligibleZones(zones);
  const watchNeeded = needsLocationWatch(zones);

  const geofenceRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
  const watchRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_WATCH_TASK);

  if (enabledZones.length === 0) {
    if (geofenceRegistered) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    if (watchRegistered) await Location.stopLocationUpdatesAsync(LOCATION_WATCH_TASK);
    return;
  }

  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) return;

  if (geofenceZones.length > 0) {
    await Location.startGeofencingAsync(GEOFENCE_TASK, geofenceZones.map(toLocationRegion));
  } else if (geofenceRegistered) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }

  if (watchNeeded) {
    await Location.startLocationUpdatesAsync(LOCATION_WATCH_TASK, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 5,
      timeInterval: 15_000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'QuietRoutine',
        notificationBody: 'Monitoring your silent zones',
      },
    });
  } else if (watchRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_WATCH_TASK);
  }
}

export async function getCurrentCoordinates(): Promise<Location.LocationObjectCoords | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return position.coords;
}

export async function watchCurrentLocation(
  onUpdate: (coords: Location.LocationObjectCoords) => void
): Promise<Location.LocationSubscription | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return null;

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 3,
      timeInterval: 2000,
    },
    (position) => onUpdate(position.coords)
  );
}

export async function checkCurrentLocationZones(): Promise<void> {
  const coords = await getCurrentCoordinates();
  if (!coords) return;

  await evaluateLocationAgainstZones({
    latitude: coords.latitude,
    longitude: coords.longitude,
  });
}
