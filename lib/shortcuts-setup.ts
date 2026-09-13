import { Alert, Linking, Platform } from 'react-native';

import { SILENCE_OFF_SHORTCUT, SILENCE_ON_SHORTCUT, openShortcutsApp } from './system-silence';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function openCreateShortcut(name: string): Promise<boolean> {
  const urls = [
    `shortcuts://create-shortcut?name=${encodeURIComponent(name)}`,
    `shortcuts://x-callback-url/create-shortcut?name=${encodeURIComponent(name)}`,
  ];

  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // try next
    }
  }
  return false;
}

/**
 * Automatically opens the iOS Shortcuts create flow for QuietRoutine On and Off.
 * Apple does not allow silent injection of Shortcuts — the OS create sheet is the
 * most automatic path available. User only needs to add “Set Focus” and save.
 */
export async function requestAutomaticShortcutsSetup(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return true;
  }

  const openedOn = await openCreateShortcut(SILENCE_ON_SHORTCUT);
  if (!openedOn) {
    await openShortcutsApp();
    Alert.alert(
      'Open Shortcuts',
      `Create “${SILENCE_ON_SHORTCUT}” (Do Not Disturb On) and “${SILENCE_OFF_SHORTCUT}” (Do Not Disturb Off), then return here.`
    );
    return false;
  }

  // Open the Off shortcut create sheet next so both exist without a second tap in-app.
  await delay(1600);
  const openedOff = await openCreateShortcut(SILENCE_OFF_SHORTCUT);
  if (!openedOff) {
    await openShortcutsApp();
  }

  Alert.alert(
    'Shortcuts ready to save',
    `QuietRoutine opened create sheets for “${SILENCE_ON_SHORTCUT}” and “${SILENCE_OFF_SHORTCUT}”.\n\nOn each one: Add Action → Set Focus → Do Not Disturb → On/Off → Done.\n\nAfter both are saved, QuietRoutine runs them from your zones and schedule.`,
    [{ text: 'Done' }]
  );

  return true;
}

/**
 * When a Focus shortcut is missing at runtime, create it automatically via Shortcuts.
 */
export async function ensureSilenceShortcutsExist(missingName?: string): Promise<void> {
  if (Platform.OS !== 'ios') return;

  if (missingName) {
    await openCreateShortcut(missingName);
    Alert.alert(
      'Shortcut missing',
      `“${missingName}” was not found, so QuietRoutine opened Shortcuts to create it. Add Set Focus → Do Not Disturb, then save.`
    );
    return;
  }

  await requestAutomaticShortcutsSetup();
}
