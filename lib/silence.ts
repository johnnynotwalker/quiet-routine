import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { SilenceReason, SilenceState } from './types';

export const SILENCE_NOTIFICATION_ID = 'quietroutine-silence-status';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function buildSilenceMessage(reason: SilenceReason | null): string {
  if (!reason) return 'Phone is silenced';
  switch (reason.type) {
    case 'zone':
      return `Currently silenced — ${reason.zoneName}`;
    case 'meeting':
      return `Currently silenced — ${reason.title}`;
    case 'manual':
      return reason.label ? `Currently silenced — ${reason.label}` : 'Currently silenced — manual mode';
  }
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('silence-status', {
      name: 'Silence Status',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });
  }
}

export async function showSilenceNotification(reason: SilenceReason | null, until: string | null): Promise<void> {
  const body = until
    ? `${buildSilenceMessage(reason).replace('Currently silenced — ', '')} · until ${new Date(until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : buildSilenceMessage(reason).replace('Currently silenced — ', '');

  await Notifications.scheduleNotificationAsync({
    identifier: SILENCE_NOTIFICATION_ID,
    content: {
      title: 'Currently silenced',
      body,
      sticky: true,
      priority: Notifications.AndroidNotificationPriority.LOW,
      ...(Platform.OS === 'android' ? { channelId: 'silence-status' } : {}),
    },
    trigger: null,
  });
}

export async function dismissSilenceNotification(): Promise<void> {
  await Notifications.dismissNotificationAsync(SILENCE_NOTIFICATION_ID);
  await Notifications.cancelScheduledNotificationAsync(SILENCE_NOTIFICATION_ID);
}

export async function applySilenceState(state: SilenceState): Promise<void> {
  await ensureNotificationPermissions();
  await setupNotificationChannel();

  if (state.isSilenced) {
    await showSilenceNotification(state.reason, state.until);
  } else {
    await dismissSilenceNotification();
  }
}

export function buildSilenceState(
  isSilenced: boolean,
  reason: SilenceReason | null,
  until: string | null = null
): SilenceState {
  return {
    isSilenced,
    reason,
    until,
    updatedAt: new Date().toISOString(),
  };
}
