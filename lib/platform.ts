import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export function supportsBackgroundLocation(): boolean {
  return Platform.OS !== 'web' && !isExpoGo();
}
