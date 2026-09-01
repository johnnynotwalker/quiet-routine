import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

export async function requestStatusNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: false,
      allowProvisional: false,
    },
  });
}

export async function getStatusNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
  return Notifications.getPermissionsAsync();
}

export function hasNotificationAccess(
  settings: Notifications.NotificationPermissionsStatus
): boolean {
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export function canShowOnLockScreen(
  settings: Notifications.NotificationPermissionsStatus
): boolean {
  if (!hasNotificationAccess(settings)) return false;

  if (Platform.OS === 'ios') {
    return settings.ios?.allowsDisplayOnLockScreen !== false;
  }

  return true;
}

export function lockScreenSettingsHint(): string {
  if (Platform.OS === 'ios') {
    return 'Open Settings → Notifications → Expo Go → turn on Lock Screen and Banners.';
  }

  return 'Open Settings → Apps → Expo Go → Notifications → allow lock screen notifications.';
}

export function openNotificationSettings(): void {
  Linking.openSettings();
}
