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

/** Detect Google-synced calendars (not the phone’s local calendar). */
export function isGoogleCalendar(calendar: Calendar): boolean {
  const sourceName = String(calendar.source?.name ?? '').toLowerCase();
  const sourceType = String(calendar.source?.type ?? '').toLowerCase();
  const title = String(calendar.title ?? '').toLowerCase();
  const owner = String(calendar.ownerAccount ?? '').toLowerCase();
  const androidName = String(calendar.name ?? '').toLowerCase();
  const haystack = `${sourceName} ${sourceType} ${title} ${owner} ${androidName}`;

  // Never treat the phone-local account as Google.
  if (calendar.source?.isLocalAccount) return false;
  if (sourceType === 'local' || sourceType === 'birthdays') return false;

  // Android Google account provider.
  if (sourceType.includes('google') || sourceType === 'com.google') return true;
  if (owner.includes('google') || owner.includes('gmail') || owner.includes('googlemail')) return true;

  // Common Google / Gmail markers on both platforms.
  if (
    haystack.includes('google') ||
    haystack.includes('gmail') ||
    haystack.includes('googlemail') ||
    haystack.includes('@gmail.') ||
    haystack.includes('@googlemail.')
  ) {
    return true;
  }

  // iOS Google accounts often arrive as CalDAV with the Gmail address as the source name.
  if (
    (sourceType === 'caldav' || sourceType.includes('caldav')) &&
    (looksLikeEmail(sourceName) || looksLikeEmail(owner) || looksLikeEmail(title))
  ) {
    // Exclude Apple iCloud and common non-Google CalDAV providers.
    if (
      haystack.includes('icloud') ||
      haystack.includes('me.com') ||
      haystack.includes('mac.com') ||
      haystack.includes('outlook') ||
      haystack.includes('hotmail') ||
      haystack.includes('live.com') ||
      haystack.includes('office365') ||
      haystack.includes('exchange') ||
      haystack.includes('yahoo')
    ) {
      return false;
    }
    // Prefer Gmail / Google Workspace markers; still accept generic CalDAV+email
    // because Google on iOS often only exposes the address as the source name.
    return true;
  }

  return false;
}

function googleAccountLabel(calendar: Calendar): string {
  const candidates = [
    calendar.ownerAccount,
    calendar.source?.name,
    calendar.title,
  ].filter((value): value is string => Boolean(value && String(value).trim()));

  const email = candidates.find((value) => looksLikeEmail(value.trim()));
  if (email) return email.trim();
  if (calendar.source?.name?.trim()) return calendar.source.name.trim();
  return calendar.title?.trim() || 'Google Calendar';
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

function noGoogleCalendarError(totalCalendars: number): string {
  if (Platform.OS === 'ios') {
    return totalCalendars > 0
      ? 'Your phone calendars are available, but no Google Calendar account was found. Add Google in iPhone Settings → Calendar → Accounts → Add Account → Google, turn Calendars on, wait for sync, then tap Import again.'
      : 'No Google Calendar found. Add Google in iPhone Settings → Calendar → Accounts → Add Account → Google, enable Calendars, then try Import again.';
  }

  return totalCalendars > 0
    ? 'Device calendars were found, but not a Google account. Add your Google account in phone Settings → Passwords & accounts / Users & accounts, enable Calendar sync, then tap Import again.'
    : 'No Google Calendar found. Add your Google account in phone Settings and enable Calendar sync, then try Import again.';
}

/**
 * Loads upcoming events from Google Calendar accounts synced on the device.
 * Local-only phone calendars are ignored so Import does not pretend to be Google.
 */
export async function loadUpcomingCalendarEvents(daysAhead = 14): Promise<CalendarLoadResult> {
  try {
    const granted = await requestCalendarAccess();
    if (!granted) {
      return {
        events: [],
        permissionGranted: false,
        googleCalendarCount: 0,
        googleAccountNames: [],
        error:
          Platform.OS === 'ios'
            ? 'Calendar access is off. Enable it in iPhone Settings → QuietRoutine → Calendars, then tap Import again.'
            : 'Calendar access is off. Enable calendar permission for QuietRoutine, then try again.',
      };
    }

    // Legacy API works in Expo Go; Calendar@next does not.
    const calendars = await getCalendarsAsync(EntityTypes.EVENT);
    const googleCalendars = calendars.filter(isGoogleCalendar);

    if (googleCalendars.length === 0) {
      return {
        events: [],
        permissionGranted: true,
        googleCalendarCount: 0,
        googleAccountNames: [],
        error: noGoogleCalendarError(calendars.length),
      };
    }

    const googleAccountNames = Array.from(
      new Set(googleCalendars.map((calendar) => googleAccountLabel(calendar)))
    );

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + daysAhead);

    const events = await getEventsAsync(
      googleCalendars.map((calendar) => calendar.id),
      start,
      end
    );

    const mapped: CalendarEventPreview[] = events
      .filter((event) => !event.allDay)
      .map((event) => {
        const calendar = googleCalendars.find((item) => item.id === event.calendarId);
        return {
          externalId: String(event.id),
          title: event.title || 'Untitled event',
          startDate: toDate(event.startDate),
          endDate: toDate(event.endDate),
          calendarTitle: calendar?.title ?? 'Google Calendar',
          accountName: calendar ? googleAccountLabel(calendar) : 'Google Calendar',
          isGoogle: true,
        };
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return {
      events: mapped,
      permissionGranted: true,
      googleCalendarCount: googleCalendars.length,
      googleAccountNames,
      error: null,
    };
  } catch (error) {
    console.error('Failed to fetch Google Calendar events', error);
    return {
      events: [],
      permissionGranted: false,
      googleCalendarCount: 0,
      googleAccountNames: [],
      error: friendlyCalendarError(error),
    };
  }
}

export async function fetchUpcomingCalendarEvents(daysAhead = 14): Promise<CalendarEventPreview[]> {
  const result = await loadUpcomingCalendarEvents(daysAhead);
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
    return 'Imports only from Google Calendar accounts synced on this phone — not the local device calendar. Add Google in Settings and turn Calendar sync on.';
  }

  return 'Imports only from Google Calendar accounts synced on this iPhone — not the local iPhone calendar. Add Google in Settings → Calendar → Accounts, then enable Calendars.';
}

/** Back-compat alias */
export const requestCalendarPermissions = requestCalendarAccess;
