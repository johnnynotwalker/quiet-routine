import { Alert, Linking, Platform } from 'react-native';

import { openFocusSettings } from './focus';
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
 * Opens Focus settings and explains how to mute incoming calls under Do Not Disturb.
 * Apps cannot reject cellular calls directly — Focus “Allow Calls From: Nobody” does it.
 */
export async function ensureIncomingCallsMuted(): Promise<void> {
  if (Platform.OS !== 'ios') {
    await Linking.openSettings();
    Alert.alert(
      'Mute incoming calls',
      'Turn on Do Not Disturb (or Total silence) so QuietRoutine can mute calls while you are silenced.'
    );
    return;
  }

  await openFocusSettings();
  Alert.alert(
    'Mute incoming calls',
    'In Focus → Do Not Disturb → People:\n• Allow Calls From → Nobody\n• Turn off Allow Repeated Calls\n\nThen QuietRoutine’s On shortcut mutes notifications and incoming calls together.',
    [{ text: 'Done' }]
  );
}

/**
 * Automatically opens the iOS Shortcuts create flow for QuietRoutine On and Off,
 * then opens Focus settings so incoming calls are silenced with DND.
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

  await delay(1600);
  const openedOff = await openCreateShortcut(SILENCE_OFF_SHORTCUT);
  if (!openedOff) {
    await openShortcutsApp();
  }

  await new Promise<void>((resolve) => {
    Alert.alert(
      'Shortcuts ready — mute calls next',
      `QuietRoutine opened create sheets for “${SILENCE_ON_SHORTCUT}” and “${SILENCE_OFF_SHORTCUT}”.\n\n1. On each: Add Action → Set Focus → Do Not Disturb → On/Off → Done.\n2. Next, Focus settings open so incoming calls stay muted too.`,
      [
        {
          text: 'Configure call silence',
          onPress: () => resolve(),
        },
      ]
    );
  });

  await ensureIncomingCallsMuted();
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
      `“${missingName}” was not found, so QuietRoutine opened Shortcuts to create it.\n\nAdd Set Focus → Do Not Disturb, save, and keep Focus → People → Allow Calls From set to Nobody so calls stay muted.`
    );
    return;
  }

  await requestAutomaticShortcutsSetup();
}
