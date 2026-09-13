import { Linking, Platform } from 'react-native';

import { ensureSilenceShortcutsExist } from './shortcuts-setup';
import { loadAppData } from './storage';

/** Shortcut names the user creates once in the Shortcuts app. */
export const SILENCE_ON_SHORTCUT = 'QuietRoutine On';
export const SILENCE_OFF_SHORTCUT = 'QuietRoutine Off';

let lastApplied: boolean | null = null;

function encodeName(name: string): string {
  return encodeURIComponent(name);
}

/** Run a named Shortcut (iOS). Returns to QuietRoutine via x-callback when possible. */
export async function runNamedShortcut(name: string): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  const encoded = encodeName(name);
  const urls = [
    `shortcuts://x-callback-url/run-shortcut?name=${encoded}&x-success=quietroutine://focus-done&x-cancel=quietroutine://`,
    `shortcuts://run-shortcut?name=${encoded}`,
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

export async function openShortcutsApp(): Promise<void> {
  if (Platform.OS !== 'ios') {
    await Linking.openSettings();
    return;
  }
  try {
    await Linking.openURL('shortcuts://');
  } catch {
    await Linking.openSettings();
  }
}

export type SystemSilenceResult = {
  applied: boolean;
  mode: 'shortcut' | 'settings' | 'skipped' | 'unsupported';
  message: string;
};

/**
 * Drive real phone silence when QuietRoutine decides you should be quiet.
 * iOS: runs Focus shortcuts the user linked (Apple does not allow apps to set Focus directly).
 * Android: opens Do Not Disturb access settings when policy control is unavailable in Expo Go.
 */
export async function applySystemSilence(
  enabled: boolean,
  options?: { force?: boolean }
): Promise<SystemSilenceResult> {
  if (Platform.OS === 'web') {
    return { applied: false, mode: 'unsupported', message: 'System silence is not available on web.' };
  }

  if (!options?.force && lastApplied === enabled) {
    return { applied: false, mode: 'skipped', message: 'Already applied.' };
  }

  const data = await loadAppData();
  const linked = data.settings.focusBridgeLinked === true;

  if (Platform.OS === 'ios') {
    if (!linked) {
      return {
        applied: false,
        mode: 'skipped',
        message: 'Link Focus once so QuietRoutine can turn Do Not Disturb on and off for you.',
      };
    }

    const name = enabled ? SILENCE_ON_SHORTCUT : SILENCE_OFF_SHORTCUT;
    const ok = await runNamedShortcut(name);
    if (ok) {
      lastApplied = enabled;
      return {
        applied: true,
        mode: 'shortcut',
        message: enabled
          ? 'Turning on Do Not Disturb via Focus (notifications + calls)…'
          : 'Turning off Do Not Disturb via Focus…',
      };
    }

    // Shortcut missing or Shortcuts failed — create it automatically.
    await ensureSilenceShortcutsExist(name);
    return {
      applied: false,
      mode: 'settings',
      message: `“${name}” was missing — QuietRoutine opened Shortcuts to create it.`,
    };
  }

  // Android — Expo Go cannot set interruption filter; open policy settings as the bridge.
  if (!linked && !options?.force) {
    return {
      applied: false,
      mode: 'skipped',
      message: 'Enable Do Not Disturb access to let QuietRoutine silence Android.',
    };
  }

  try {
    await Linking.openSettings();
  } catch {
    // ignore
  }
  lastApplied = enabled;
  return {
    applied: true,
    mode: 'settings',
    message: enabled
      ? 'Open Do Not Disturb and allow QuietRoutine, then enable DND.'
      : 'Turn off Do Not Disturb when you are done.',
  };
}

/** Manual one-tap: silence now via shortcut or Focus settings. */
export async function enableSystemSilenceNow(): Promise<SystemSilenceResult> {
  const data = await loadAppData();
  if (Platform.OS === 'ios' && data.settings.focusBridgeLinked) {
    return applySystemSilence(true, { force: true });
  }
  if (Platform.OS === 'ios') {
    try {
      await Linking.openURL('App-prefs:FOCUS');
    } catch {
      await Linking.openSettings();
    }
    return {
      applied: true,
      mode: 'settings',
      message: 'Enable Do Not Disturb or a Focus — QuietRoutine will keep deciding when.',
    };
  }
  return applySystemSilence(true, { force: true });
}

export function resetSystemSilenceCache(): void {
  lastApplied = null;
}
