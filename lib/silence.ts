import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { SilenceReason, SilenceState } from './types';

export const STATUS_NOTIFICATION_ID = 'quietroutine-status';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isAlarm = notification.request.content.data?.type === 'alarm';

    return {
      shouldShowAlert: true,
      shouldPlaySound: isAlarm,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

function buildSilenceMessage(reason: SilenceReason | null): string {
  if (!reason) return 'Phone is silenced';
  switch (reason.type) {
    case 'zone':
      return `Silenced in ${reason.zoneName}`;
    case 'meeting':
      return `Silenced for ${reason.title}`;
    case 'manual':
      return reason.label ? `Silenced — ${reason.label}` : 'Silenced — manual mode';
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

async function showStatusNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: STATUS_NOTIFICATION_ID,
    content: {
      title,
      body,
      sticky: true,
      priority: Notifications.AndroidNotificationPriority.LOW,
      ...(Platform.OS === 'android' ? { channelId: 'silence-status' } : {}),
    },
    trigger: null,
  });
}

export async function showSilenceNotification(reason: SilenceReason | null, until: string | null): Promise<void> {
  const detail = buildSilenceMessage(reason);
  const body = until
    ? `${detail} · until ${new Date(until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : detail;

  await showStatusNotification('Phone is silenced', body);
}

export async function showNotSilencedNotification(): Promise<void> {
  await showStatusNotification(
    'Phone is not silenced',
    'QuietRoutine is monitoring your zones and schedule.'
  );
}

export async function dismissStatusNotification(): Promise<void> {
  await Notifications.dismissNotificationAsync(STATUS_NOTIFICATION_ID);
  await Notifications.cancelScheduledNotificationAsync(STATUS_NOTIFICATION_ID);
}

export async function applySilenceState(state: SilenceState): Promise<void> {
  await ensureNotificationPermissions();
  await setupNotificationChannel();

  if (state.isSilenced) {
    await showSilenceNotification(state.reason, state.until);
  } else {
    await showNotSilencedNotification();
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
