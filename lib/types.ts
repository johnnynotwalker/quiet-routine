export type SilentZone = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  enabled: boolean;
};

export type RoutineItem = {
  id: string;
  name: string;
  durationMinutes: number;
  zoneId?: string;
  order: number;
};

export type ScheduledSilence = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date?: string;
  enabled: boolean;
};

export type SilenceReason =
  | { type: 'zone'; zoneName: string; zoneId: string }
  | { type: 'meeting'; title: string; meetingId: string }
  | { type: 'manual'; label?: string };

export type SilenceState = {
  isSilenced: boolean;
  reason: SilenceReason | null;
  until: string | null;
  updatedAt: string;
};

export type AppData = {
  zones: SilentZone[];
  routines: RoutineItem[];
  schedule: ScheduledSilence[];
  silence: SilenceState;
};

export const DEFAULT_SILENCE: SilenceState = {
  isSilenced: false,
  reason: null,
  until: null,
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_APP_DATA: AppData = {
  zones: [],
  routines: [],
  schedule: [],
  silence: DEFAULT_SILENCE,
};
