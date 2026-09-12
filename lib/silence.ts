import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  canShowOnLockScreen,
  getStatusNotificationPermissions,
  hasNotificationAccess,
  requestStatusNotificationPermissions,
} from './notification-permissions';
import { buildStatusContent } from './status-content';
import { applySystemSilence } from './system-silence';
import { SilenceReason, SilenceState } from './types';

export const STATUS_NOTIFICATION_ID = 'quietroutine-status';
const STATUS_CHANNEL_ID = 'quietroutine-lock-screen';

let lastPostedStatus: { title: string; body: string } | null = null;

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    const isAlarm = data?.type === 'alarm';
    const isStatus = data?.type === 'status';

    return {
      shouldShowAlert: !isStatus,
      shouldPlaySound: isAlarm,
      shouldSetBadge: false,
      shouldShowBanner: !isStatus,
      shouldShowList: true,
    };
  },
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  const settings = await getStatusNotificationPermissions();
  if (hasNotificationAccess(settings)) {
    return true;
  }

  const requested = await requestStatusNotificationPermissions();
  return hasNotificationAccess(requested);
}

export async function getLockScreenNotificationReady(): Promise<boolean> {
  const settings = await getStatusNotificationPermissions();
  return canShowOnLockScreen(settings);
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(STATUS_CHANNEL_ID, {
    name: 'Lock screen status',
    description: 'Shows whether your phone should be silenced on the lock screen',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
    showBadge: false,
  });
}

async function postStatusNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: STATUS_NOTIFICATION_ID,
    content: {
      title,
      body,
      subtitle: Platform.OS === 'ios' ? 'QuietRoutine' : undefined,
      sticky: true,
      autoDismiss: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { type: 'status', persistent: true },
      ...(Platform.OS === 'android' ? { channelId: STATUS_CHANNEL_ID } : {}),
      ...(Platform.OS === 'ios' ? { interruptionLevel: 'active' as const } : {}),
    },
    trigger: null,
  });

  lastPostedStatus = { title, body };
}

export async function isStatusNotificationVisible(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    return presented.some((notification) => notification.request.identifier === STATUS_NOTIFICATION_ID);
  } catch {
    return false;
  }
}

export async function ensureStatusNotification(state: SilenceState): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  await setupNotificationChannel();

  const { title, body } = buildStatusContent(state);
  const visible = await isStatusNotificationVisible();
  const changed =
    !lastPostedStatus || lastPostedStatus.title !== title || lastPostedStatus.body !== body;

  if (!visible || changed) {
    await postStatusNotification(title, body);
  }
}

export async function showSilenceNotification(reason: SilenceReason | null, until: string | null): Promise<void> {
  await ensureStatusNotification(buildSilenceState(true, reason, until));
}

export async function showNotSilencedNotification(): Promise<void> {
  await ensureStatusNotification(buildSilenceState(false, null));
}

export async function dismissStatusNotification(): Promise<void> {
  await Notifications.dismissNotificationAsync(STATUS_NOTIFICATION_ID);
  await Notifications.cancelScheduledNotificationAsync(STATUS_NOTIFICATION_ID);
  lastPostedStatus = null;
}

export async function applySilenceState(state: SilenceState): Promise<void> {
  await ensureStatusNotification(state);
  // Drive real Focus / DND when the user linked the Focus bridge.
  await applySystemSilence(state.isSilenced);
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
