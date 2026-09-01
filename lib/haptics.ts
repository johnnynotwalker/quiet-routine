import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export async function tapHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function selectHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Haptics.selectionAsync();
}
