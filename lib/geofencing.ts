import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { loadAppData, updateSilence } from './storage';
import { applySilenceState, buildSilenceState } from './silence';
import { SilentZone } from './types';

export const GEOFENCE_TASK = 'QUIETROUTINE_GEOFENCE';

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
    const silence = buildSilenceState(true, {
      type: 'zone',
      zoneName: zone.name,
      zoneId: zone.id,
    });
    await updateSilence(silence);
    await applySilenceState(silence);
    return;
  }

  if (
    event.eventType === Location.GeofencingEventType.Exit &&
    appData.silence.reason?.type === 'zone' &&
    appData.silence.reason.zoneId === zone.id
  ) {
    const silence = buildSilenceState(false, null);
    await updateSilence(silence);
    await applySilenceState(silence);
  }
});

export function toLocationRegion(zone: SilentZone): Location.LocationRegion {
  return {
    identifier: zone.id,
    latitude: zone.latitude,
    longitude: zone.longitude,
    radius: zone.radius,
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

export async function syncGeofencing(zones: SilentZone[]): Promise<void> {
  const enabledZones = zones.filter((zone) => zone.enabled);
  const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);

  if (enabledZones.length === 0) {
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }
    return;
  }

  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) return;

  await Location.startGeofencingAsync(
    GEOFENCE_TASK,
    enabledZones.map(toLocationRegion)
  );
}

export async function getCurrentCoordinates(): Promise<Location.LocationObjectCoords | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return position.coords;
}
