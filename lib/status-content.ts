import { Platform } from 'react-native';

import { SilenceReason, SilenceState } from './types';

export function buildSilenceMessage(reason: SilenceReason | null): string {
  if (!reason) return 'Phone is silenced';
  switch (reason.type) {
    case 'zone':
      return `Silenced in ${reason.zoneName}`;
    case 'meeting':
      return `Silenced for ${reason.title}`;
    case 'manual':
      return reason.label ? `Silenced — ${reason.label}` : 'Silenced — manual mode';
  }
}

export function buildStatusContent(state: SilenceState): { title: string; body: string } {
  if (state.isSilenced) {
    const detail = buildSilenceMessage(state.reason);
    let body = state.until
      ? `${detail} · until ${new Date(state.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : detail;
    if (Platform.OS === 'ios') {
      body = `${body} · Open Focus to mute the ringer`;
    }
    return { title: 'Phone is silenced', body };
  }

  return {
    title: 'Phone is not silenced',
    body: 'QuietRoutine is monitoring your zones and schedule.',
  };
}
