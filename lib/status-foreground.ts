import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { buildStatusContent } from './status-content';
import { SilenceState } from './types';

export const STATUS_FOREGROUND_TASK = 'QUIETROUTINE_STATUS_FOREGROUND';

const isNative = Platform.OS !== 'web';

if (isNative) {
  TaskManager.defineTask(STATUS_FOREGROUND_TASK, async () => {
    // The task exists to keep Android's foreground-service notification pinned.
  });
}

let lastForegroundStatus: { title: string; body: string } | null = null;

export async function syncStatusForegroundService(state: SilenceState): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) return false;

  const { title, body } = buildStatusContent(state);
  const changed =
    !lastForegroundStatus || lastForegroundStatus.title !== title || lastForegroundStatus.body !== body;

  const registered = await TaskManager.isTaskRegisteredAsync(STATUS_FOREGROUND_TASK);

  if (registered && !changed) {
    return true;
  }

  if (registered) {
    await Location.stopLocationUpdatesAsync(STATUS_FOREGROUND_TASK);
  }

  try {
    await Location.startLocationUpdatesAsync(STATUS_FOREGROUND_TASK, {
      accuracy: Location.Accuracy.Lowest,
      timeInterval: 300_000,
      distanceInterval: 250,
      pausesUpdatesAutomatically: true,
      foregroundService: {
        notificationTitle: title,
        notificationBody: body,
        notificationColor: '#5B5FC7',
      },
    });
    lastForegroundStatus = { title, body };
    return true;
  } catch (error) {
    console.warn('Unable to start pinned status foreground service:', error);
    return false;
  }
}

export async function stopStatusForegroundService(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const registered = await TaskManager.isTaskRegisteredAsync(STATUS_FOREGROUND_TASK);
  if (registered) {
    await Location.stopLocationUpdatesAsync(STATUS_FOREGROUND_TASK);
  }

  lastForegroundStatus = null;
}
