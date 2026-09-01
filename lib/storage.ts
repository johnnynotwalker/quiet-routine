import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AppData,
  AppSettings,
  DEFAULT_APP_DATA,
  DEFAULT_SETTINGS,
  DEFAULT_SILENCE,
  RoutineItem,
  ScheduledSilence,
  SilenceState,
  SilentZone,
} from './types';

const STORAGE_KEY = '@quietroutine/app-data';

function normalizeZone(zone: SilentZone): SilentZone {
  if (zone.shape) return zone;

  return {
    ...zone,
    shape: 'radius',
  };
}

function normalizeMeeting(meeting: ScheduledSilence): ScheduledSilence {
  return {
    ...meeting,
    useCalendarEnd: meeting.useCalendarEnd ?? true,
    reminderMinutes: meeting.reminderMinutes ?? 30,
    source: meeting.source ?? 'local',
  };
}

function mergeAppData(parsed: Partial<AppData> | null): AppData {
  return {
    zones: (parsed?.zones ?? []).map(normalizeZone),
    routines: parsed?.routines ?? [],
    schedule: (parsed?.schedule ?? []).map(normalizeMeeting),
    silence: parsed?.silence ?? DEFAULT_SILENCE,
    settings: { ...DEFAULT_SETTINGS, ...parsed?.settings },
  };
}

export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_DATA;
    return mergeAppData(JSON.parse(raw) as Partial<AppData>);
  } catch {
    return DEFAULT_APP_DATA;
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function updateZones(zones: SilentZone[]): Promise<AppData> {
  const data = await loadAppData();
  const next = { ...data, zones };
  await saveAppData(next);
  return next;
}

export async function updateRoutines(routines: RoutineItem[]): Promise<AppData> {
  const data = await loadAppData();
  const next = { ...data, routines };
  await saveAppData(next);
  return next;
}

export async function updateSchedule(schedule: ScheduledSilence[]): Promise<AppData> {
  const data = await loadAppData();
  const next = { ...data, schedule };
  await saveAppData(next);
  return next;
}

export async function updateSilence(silence: SilenceState): Promise<AppData> {
  const data = await loadAppData();
  const next = { ...data, silence };
  await saveAppData(next);
  return next;
}

export async function updateSettings(settings: AppSettings): Promise<AppData> {
  const data = await loadAppData();
  const next = { ...data, settings };
  await saveAppData(next);
  return next;
}
