import { Alert, Linking, Platform } from 'react-native';

import { openFocusSettings } from './focus';
import { SILENCE_OFF_SHORTCUT, SILENCE_ON_SHORTCUT, openShortcutsApp } from './system-silence';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let createInFlight: Promise<boolean> | null = null;

/** Deep link Shortcuts calls when a named shortcut is missing. */
export const CREATE_SHORTCUTS_URL = 'quietroutine://create-shortcuts';

async function openCreateShortcut(name: string): Promise<boolean> {
  // Apple documents create-shortcut; try several variants for Expo Go / iOS versions.
  const urls = [
    `shortcuts://create-shortcut?name=${encodeURIComponent(name)}`,
    `shortcuts://x-callback-url/create-shortcut?name=${encodeURIComponent(name)}`,
    `shortcuts://create-shortcut?name=${encodeURIComponent(name)}&iconColor=4278228479&iconGlyph=30`,
  ];

  for (const url of urls) {
    try {
      const can = await Linking.canOpenURL(url).catch(() => true);
      if (!can) continue;
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
    'In Focus → Do Not Disturb → People:\n• Allow Calls From → Nobody\n• Turn off Allow Repeated Calls\n\nThen QuietRoutine On mutes notifications and incoming calls together.',
    [{ text: 'Done' }]
  );
}

/**
 * Creates QuietRoutine On and QuietRoutine Off in the Shortcuts app if they are missing.
 * Apple will not let apps inject finished Shortcuts silently — we open pre-named create sheets
 * for both and walk the user through adding Set Focus → Do Not Disturb.
 */
export async function createQuietRoutineShortcuts(): Promise<boolean> {
  if (Platform.OS !== 'ios') return true;

  // Coalesce overlapping calls (deep link + silence failure).
  if (createInFlight) return createInFlight;

  createInFlight = (async () => {
    await new Promise<void>((resolve) => {
      Alert.alert(
        'Creating QuietRoutine shortcuts',
        `QuietRoutine will open Shortcuts and create:\n• “${SILENCE_ON_SHORTCUT}”\n• “${SILENCE_OFF_SHORTCUT}”\n\nOn each sheet, tap Add Action → Set Focus → Do Not Disturb → On or Off → Done.`,
        [{ text: 'Create now', onPress: () => resolve() }]
      );
    });

    const openedOn = await openCreateShortcut(SILENCE_ON_SHORTCUT);
    if (!openedOn) {
      await openShortcutsApp();
      Alert.alert(
        'Open Shortcuts',
        `Create a shortcut named exactly “${SILENCE_ON_SHORTCUT}” with Set Focus → Do Not Disturb → On, then another named “${SILENCE_OFF_SHORTCUT}” with Off.`
      );
      return false;
    }

    await delay(1800);
    const openedOff = await openCreateShortcut(SILENCE_OFF_SHORTCUT);
    if (!openedOff) {
      await openShortcutsApp();
    }

    await new Promise<void>((resolve) => {
      Alert.alert(
        'Finish both shortcuts',
        `1. “${SILENCE_ON_SHORTCUT}”: Add Action → Set Focus → Do Not Disturb → Turn On → Done.\n2. “${SILENCE_OFF_SHORTCUT}”: Set Focus → Do Not Disturb → Turn Off → Done.\n3. Next, set Allow Calls From → Nobody so ringing is muted too.`,
        [{ text: 'Mute calls next', onPress: () => resolve() }]
      );
    });

    await ensureIncomingCallsMuted();
    return true;
  })().finally(() => {
    createInFlight = null;
  });

  return createInFlight;
}

/** Back-compat alias used by PermissionsGate / SilenceLimitationsCard. */
export async function requestAutomaticShortcutsSetup(): Promise<boolean> {
  return createQuietRoutineShortcuts();
}

/**
 * Always create both On and Off when anything is missing — users usually lack both.
 */
export async function ensureSilenceShortcutsExist(_missingName?: string): Promise<void> {
  if (Platform.OS !== 'ios') return;
  await createQuietRoutineShortcuts();
}

/**
 * Handle quietroutine:// deep links from Shortcuts x-callback (missing shortcut → create).
 */
export function handleShortcutDeepLink(url: string | null | undefined): boolean {
  if (!url || Platform.OS !== 'ios') return false;
  const normalized = url.toLowerCase();
  if (
    normalized.startsWith('quietroutine://create-shortcuts') ||
    normalized.startsWith('quietroutine://missing-shortcut') ||
    normalized.includes('create-shortcuts') ||
    normalized.includes('missing-shortcut')
  ) {
    createQuietRoutineShortcuts().catch(console.error);
    return true;
  }
  return false;
}
