export type ZoneShape = 'radius' | 'polygon';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type SilentZone = {
  id: string;
  name: string;
  shape: ZoneShape;
  latitude: number;
  longitude: number;
  radius: number;
  polygon?: LatLng[];
  enabled: boolean;
};

export type RoutineItem = {
  id: string;
  name: string;
  durationMinutes: number;
  zoneId?: string;
  order: number;
};

export type EventSource = 'local' | 'google';

export type ScheduledSilence = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date?: string;
  enabled: boolean;
  useCalendarEnd: boolean;
  customEndTime?: string;
  reminderMinutes: number;
  source: EventSource;
  externalId?: string;
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
  /** When set, zones/schedule must not re-mute until this time. */
  pausedUntil: string | null;
};

export type AppSettings = {
  permissionsAcknowledged: boolean;
  defaultReminderMinutes: number;
  /** When true, QuietRoutine runs Focus shortcuts to toggle real Do Not Disturb. */
  focusBridgeLinked: boolean;
  /** Calendar IDs the user picked as Google calendars (iPhone EventKit). */
  googleCalendarIds: string[];
};

export type AppData = {
  zones: SilentZone[];
  routines: RoutineItem[];
  schedule: ScheduledSilence[];
  silence: SilenceState;
  settings: AppSettings;
};

export const DEFAULT_SETTINGS: AppSettings = {
  permissionsAcknowledged: false,
  defaultReminderMinutes: 30,
  focusBridgeLinked: false,
  googleCalendarIds: [],
};

export const DEFAULT_SILENCE: SilenceState = {
  isSilenced: false,
  reason: null,
  until: null,
  updatedAt: new Date().toISOString(),
  pausedUntil: null,
};

export const DEFAULT_APP_DATA: AppData = {
  zones: [],
  routines: [],
  schedule: [],
  silence: DEFAULT_SILENCE,
  settings: DEFAULT_SETTINGS,
};

export const RADIUS_PRESETS = [50, 100, 150] as const;

export type RadiusPreset = (typeof RADIUS_PRESETS)[number];
