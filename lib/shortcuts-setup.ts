import { Alert, Linking, Platform } from 'react-native';

import { SILENCE_OFF_SHORTCUT, SILENCE_ON_SHORTCUT, openShortcutsApp } from './system-silence';

/**
 * Opens Shortcuts so QuietRoutine On / Off can be added.
 * Apple does not allow apps to inject Shortcuts with zero user confirmation,
 * so we open the create flow and mark the bridge linked after the user accepts in PermissionsGate.
 */
export async function requestAutomaticShortcutsSetup(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return true;
  }

  const createOn = `shortcuts://create-shortcut?name=${encodeURIComponent(SILENCE_ON_SHORTCUT)}`;

  try {
    await Linking.openURL(createOn);
  } catch {
    await openShortcutsApp();
  }

  Alert.alert(
    'Add QuietRoutine On & Off',
    `In Shortcuts:\n1. Add “Set Focus” → Do Not Disturb → On → save as “${SILENCE_ON_SHORTCUT}”.\n2. Duplicate it, set Focus Off, save as “${SILENCE_OFF_SHORTCUT}”.\n\nQuietRoutine will run them from your zones and schedule.`,
    [{ text: 'Done' }]
  );

  return true;
}
