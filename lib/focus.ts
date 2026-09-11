import { Linking, Platform } from 'react-native';

const FOCUS_CANDIDATES = [
  'App-prefs:FOCUS',
  'App-prefs:root=FOCUS',
  'prefs:root=DO_NOT_DISTURB',
  'App-prefs:root=DO_NOT_DISTURB',
];

/** Open iOS Focus / DND settings when possible; otherwise system Settings. */
export async function openFocusSettings(): Promise<void> {
  if (Platform.OS !== 'ios') {
    await Linking.openSettings();
    return;
  }

  for (const url of FOCUS_CANDIDATES) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // try next candidate
    }
  }

  try {
    await Linking.openURL(FOCUS_CANDIDATES[0]);
    return;
  } catch {
    await Linking.openSettings();
  }
}
