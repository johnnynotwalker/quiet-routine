import {
  EntityTypes,
  getCalendarPermissionsAsync,
  getCalendarsAsync,
  getEventsAsync,
  requestCalendarPermissionsAsync,
  type Calendar,
} from 'expo-calendar/legacy';
import { Platform } from 'react-native';

import { ScheduledSilence } from './types';
import { createId } from './time';

export type CalendarAccountKind = 'google' | 'icloud' | 'local' | 'exchange' | 'other';

export type DeviceCalendarInfo = {
  id: string;
  title: string;
  sourceName: string;
  sourceType: string;
  kind: CalendarAccountKind;
  accountName: string;
  isLocal: boolean;
};

export type CalendarEventPreview = {
  externalId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  calendarTitle: string;
  /** Account / source label, e.g. Gmail address. */
  accountName: string;
  isGoogle: boolean;
};

export type CalendarLoadResult = {
  events: CalendarEventPreview[];
  /** null when connected successfully (even if there are zero events). */
  error: string | null;
  permissionGranted: boolean;
  googleCalendarCount: number;
  googleAccountNames: string[];
  /** Non-local calendars the user can pick when Google isn’t auto-detected. */
  selectableCalendars: DeviceCalendarInfo[];
  discoveredCalendars: DeviceCalendarInfo[];
};

function formatTime(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function friendlyCalendarError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/Calendar@next|not available in Expo Go/i.test(message)) {
    return 'Calendar needs a rebuild to use the latest API. Fully close Expo Go, reopen this project, and try Import again.';
  }
  if (message.trim()) return message;
  return 'Could not connect to Google Calendar. Fully close Expo Go and try again.';
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function fields(calendar: Calendar) {
  const sourceName = String(calendar.source?.name ?? '').trim();
  const sourceType = String(calendar.source?.type ?? '').trim().toLowerCase();
  const title = String(calendar.title ?? '').trim();
  const owner = String(calendar.ownerAccount ?? '').trim();
  const androidName = String(calendar.name ?? '').trim();
  const haystack = `${sourceName} ${sourceType} ${title} ${owner} ${androidName}`.toLowerCase();
  return { sourceName, sourceType, title, owner, androidName, haystack };
}

/** On My iPhone / local device calendars — never import as Google. */
export function isLocalCalendar(calendar: Calendar): boolean {
  if (calendar.source?.isLocalAccount === true) return true;

  const { sourceName, sourceType, haystack } = fields(calendar);
  if (sourceType === 'local' || sourceType === 'birthdays') return true;
  if (
    haystack.includes('on my iphone') ||
    haystack.includes('on my ipad') ||
    haystack.includes('on my mac') ||
    sourceName.toLowerCase() === 'local' ||
    sourceName.toLowerCase() === 'other'
  ) {
    return true;
  }
  return false;
}

function isIcloudCalendar(calendar: Calendar): boolean {
  const { haystack, sourceType } = fields(calendar);
  if (sourceType === 'mobileme') return true;
  return haystack.includes('icloud') || haystack.includes('me.com') || haystack.includes('mac.com');
}

function isExchangeCalendar(calendar: Calendar): boolean {
  const { haystack, sourceType } = fields(calendar);
  if (sourceType === 'exchange') return true;
  return (
    haystack.includes('outlook') ||
    haystack.includes('hotmail') ||
    haystack.includes('live.com') ||
    haystack.includes('office365') ||
    haystack.includes('exchange')
  );
}

/**
 * Detect Google-synced calendars on the device.
 * Local / iCloud / Exchange calendars are never treated as Google.
 */
export function isGoogleCalendar(calendar: Calendar): boolean {
  if (isLocalCalendar(calendar)) return false;
  if (isIcloudCalendar(calendar)) return false;
  if (isExchangeCalendar(calendar)) return false;

  const { sourceName, sourceType, title, owner, haystack } = fields(calendar);

  if (sourceType.includes('google') || sourceType === 'com.google') return true;
  if (owner.includes('google') || owner.includes('gmail') || owner.includes('googlemail')) return true;

  if (
    haystack.includes('google') ||
    haystack.includes('gmail') ||
    haystack.includes('googlemail') ||
    haystack.includes('@gmail.') ||
    haystack.includes('@googlemail.')
  ) {
    return true;
  }

  // iOS: Google via Settings → Calendar → Accounts is CalDAV + email (often no "google" string).
  if (sourceType === 'caldav' || sourceType.includes('caldav')) {
    if (looksLikeEmail(sourceName) || looksLikeEmail(owner) || looksLikeEmail(title)) {
      if (haystack.includes('yahoo')) return false;
      return true;
    }
    if (sourceName.toLowerCase() === 'gmail' || title.toLowerCase() === 'gmail') {
      return true;
    }
  }

  if (sourceType === 'subscribed' && haystack.includes('google')) {
    return true;
  }

  return false;
}

export function classifyCalendar(calendar: Calendar): CalendarAccountKind {
  if (isLocalCalendar(calendar)) return 'local';
  if (isIcloudCalendar(calendar)) return 'icloud';
  if (isExchangeCalendar(calendar)) return 'exchange';
  if (isGoogleCalendar(calendar)) return 'google';
  return 'other';
}

function googleAccountLabel(calendar: Calendar): string {
  const candidates = [calendar.ownerAccount, calendar.source?.name, calendar.title].filter(
    (value): value is string => Boolean(value && String(value).trim())
  );
  const email = candidates.find((value) => looksLikeEmail(value.trim()));
  if (email) return email.trim();
  if (calendar.source?.name?.trim()) return calendar.source.name.trim();
  return calendar.title?.trim() || 'Google Calendar';
}

export function toDeviceCalendarInfo(calendar: Calendar): DeviceCalendarInfo {
  const kind = classifyCalendar(calendar);
  return {
    id: calendar.id,
    title: calendar.title?.trim() || 'Untitled calendar',
    sourceName: calendar.source?.name?.trim() || 'Unknown source',
    sourceType: String(calendar.source?.type ?? 'unknown'),
    kind,
    accountName: googleAccountLabel(calendar),
    isLocal: kind === 'local',
  };
}

export async function requestCalendarAccess(): Promise<boolean> {
  try {
    const existing = await getCalendarPermissionsAsync();
    if (existing.granted || existing.status === 'granted') {
      return true;
    }
    const requested = await requestCalendarPermissionsAsync();
    return requested.granted || requested.status === 'granted';
  } catch (error) {
    console.error('Calendar permission request failed', error);
    return false;
  }
}

function noGoogleCalendarError(
  discovered: DeviceCalendarInfo[],
  hasSelectable: boolean
): string {
  const localCount = discovered.filter((item) => item.kind === 'local').length;
  const remoteCount = discovered.filter((item) => item.kind !== 'local').length;

  if (Platform.OS === 'ios') {
    if (hasSelectable) {
      return 'Google wasn’t auto-detected. Tap your Google / Gmail calendar below (not On My iPhone), then Import again.';
    }
    if (localCount > 0 && remoteCount === 0) {
      return 'Only On My iPhone calendars are visible — not Google. 1) Settings → Calendar → Accounts → Add Account → Google (Calendars ON). 2) Settings → Expo Go → Calendars → Full Access (or select your Google calendars).';
    }
    return 'No Google Calendar found. Add Google in Settings → Calendar → Accounts → Add Account → Google, enable Calendars, then give Expo Go Full Access to those calendars.';
  }

  if (hasSelectable) {
    return 'Google wasn’t auto-detected. Tap your Google account calendar below, then Import again.';
  }
  return 'No Google Calendar found. Add your Google account in phone Settings and enable Calendar sync, then try Import again.';
}

export type LoadCalendarOptions = {
  daysAhead?: number;
  /** Calendar IDs the user marked as their Google calendars. */
  preferredCalendarIds?: string[];
};

/**
 * Loads upcoming events from Google Calendar accounts synced on the device.
 * Local-only phone calendars are never imported.
 */
export async function loadUpcomingCalendarEvents(
  options: LoadCalendarOptions | number = {}
): Promise<CalendarLoadResult> {
  const normalized: LoadCalendarOptions =
    typeof options === 'number' ? { daysAhead: options } : options;
  const daysAhead = normalized.daysAhead ?? 14;
  const preferredCalendarIds = normalized.preferredCalendarIds ?? [];

  const empty = (overrides: Partial<CalendarLoadResult>): CalendarLoadResult => ({
    events: [],
    permissionGranted: false,
    googleCalendarCount: 0,
    googleAccountNames: [],
    selectableCalendars: [],
    discoveredCalendars: [],
    error: null,
    ...overrides,
  });

  try {
    const granted = await requestCalendarAccess();
    if (!granted) {
      return empty({
        error:
          Platform.OS === 'ios'
            ? 'Calendar access is off. In Settings → Expo Go → Calendars, choose Full Access (include your Google calendars), then tap Import again.'
            : 'Calendar access is off. Enable calendar permission for QuietRoutine, then try again.',
      });
    }

    // Legacy API works in Expo Go; Calendar@next does not.
    const calendars = await getCalendarsAsync(EntityTypes.EVENT);
    const discoveredCalendars = calendars.map(toDeviceCalendarInfo);

    // Hard rule: never import On My iPhone / local calendars.
    const nonLocal = calendars.filter((calendar) => !isLocalCalendar(calendar));
    const googleCalendars = nonLocal.filter(isGoogleCalendar);

    const preferredSet = new Set(preferredCalendarIds);
    const preferredCalendars = nonLocal.filter((calendar) => preferredSet.has(calendar.id));

    // Prefer the user’s picked Google calendars when set; otherwise auto-detect.
    // Local / On My iPhone calendars are never included.
    const importCalendars =
      preferredCalendars.length > 0
        ? preferredCalendars
        : googleCalendars.length > 0
          ? googleCalendars
          : [];

    const selectableCalendars = nonLocal.map(toDeviceCalendarInfo);

    if (importCalendars.length === 0) {
      return empty({
        permissionGranted: true,
        discoveredCalendars,
        selectableCalendars,
        error: noGoogleCalendarError(discoveredCalendars, selectableCalendars.length > 0),
      });
    }

    const googleAccountNames = Array.from(
      new Set(importCalendars.map((calendar) => googleAccountLabel(calendar)))
    );

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + daysAhead);

    const events = await getEventsAsync(
      importCalendars.map((calendar) => calendar.id),
      start,
      end
    );

    const mapped: CalendarEventPreview[] = events
      .filter((event) => !event.allDay)
      .map((event) => {
        const calendar = importCalendars.find((item) => item.id === event.calendarId);
        return {
          externalId: String(event.id),
          title: event.title || 'Untitled event',
          startDate: toDate(event.startDate),
          endDate: toDate(event.endDate),
          calendarTitle: calendar?.title ?? 'Google Calendar',
          accountName: calendar ? googleAccountLabel(calendar) : 'Google Calendar',
          isGoogle: calendar ? isGoogleCalendar(calendar) || preferredSet.has(calendar.id) : true,
        };
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return {
      events: mapped,
      permissionGranted: true,
      googleCalendarCount: importCalendars.length,
      googleAccountNames,
      selectableCalendars,
      discoveredCalendars,
      error: null,
    };
  } catch (error) {
    console.error('Failed to fetch Google Calendar events', error);
    return empty({
      error: friendlyCalendarError(error),
    });
  }
}

export async function fetchUpcomingCalendarEvents(daysAhead = 14): Promise<CalendarEventPreview[]> {
  const result = await loadUpcomingCalendarEvents({ daysAhead });
  if (!result.permissionGranted && result.error) {
    throw new Error(result.error);
  }
  return result.events;
}

export function calendarEventToScheduledSilence(
  event: CalendarEventPreview,
  reminderMinutes = 30
): ScheduledSilence {
  return {
    id: createId('gcal'),
    title: event.title,
    startTime: formatTime(event.startDate),
    endTime: formatTime(event.endDate),
    date: formatDate(event.startDate),
    enabled: true,
    useCalendarEnd: true,
    reminderMinutes,
    source: 'google',
    externalId: event.externalId,
  };
}

export function describeCalendarAccess(): string {
  if (Platform.OS === 'android') {
    return 'Imports only from Google Calendar accounts synced on this phone — never the local device calendar. Pick your Google calendars below if Import needs a nudge.';
  }

  return 'Imports only from Google Calendar synced into iPhone Calendar — never On My iPhone. Add Google in Settings → Calendar → Accounts, give Expo Go Full Access, then pick your Google calendars below if they are not auto-detected.';
}

/** Back-compat alias */
export const requestCalendarPermissions = requestCalendarAccess;
