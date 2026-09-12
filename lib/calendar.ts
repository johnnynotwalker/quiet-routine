import {
  EntityTypes,
  getCalendarPermissionsAsync,
  getCalendarsAsync,
  getEventsAsync,
  requestCalendarPermissionsAsync,
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
};

export type CalendarLoadResult = {
  events: CalendarEventPreview[];
  /** null when connected successfully (even if there are zero events). */
  error: string | null;
  permissionGranted: boolean;
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
  return 'Could not connect to the device calendar. Fully close Expo Go and try again.';
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

/** Preferred UI helper — empty calendars are success, not a connection failure. */
export async function loadUpcomingCalendarEvents(daysAhead = 14): Promise<CalendarLoadResult> {
  try {
    const granted = await requestCalendarAccess();
    if (!granted) {
      return {
        events: [],
        permissionGranted: false,
        error:
          Platform.OS === 'ios'
            ? 'Calendar access is off. Enable it in iPhone Settings → QuietRoutine → Calendars, then tap Import again.'
            : 'Calendar access is off. Enable calendar permission for QuietRoutine, then try again.',
      };
    }

    // Legacy API works in Expo Go; the Calendar@next APIs do not.
    const calendars = await getCalendarsAsync(EntityTypes.EVENT);
    if (calendars.length === 0) {
      return {
        events: [],
        permissionGranted: true,
        error:
          Platform.OS === 'ios'
            ? 'No calendars found. Add Google Calendar in iPhone Settings → Calendar → Accounts, then try again.'
            : 'No calendars found. Add a Google account in system Settings, then try again.',
      };
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + daysAhead);

    const events = await getEventsAsync(
      calendars.map((calendar) => calendar.id),
      start,
      end
    );

    const mapped: CalendarEventPreview[] = events
      .filter((event) => !event.allDay)
      .map((event) => {
        const calendar = calendars.find((item) => item.id === event.calendarId);
        return {
          externalId: String(event.id),
          title: event.title || 'Untitled event',
          startDate: toDate(event.startDate),
          endDate: toDate(event.endDate),
          calendarTitle: calendar?.title ?? calendar?.source?.name ?? 'Calendar',
        };
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return {
      events: mapped,
      permissionGranted: true,
      error: null,
    };
  } catch (error) {
    console.error('Failed to fetch calendar events', error);
    return {
      events: [],
      permissionGranted: false,
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
    return 'Imports events from Google Calendar and other calendars synced on this phone.';
  }

  return 'Imports events from calendars synced on this iPhone (including Google Calendar if added in Settings → Calendar → Accounts).';
}

/** Back-compat alias */
export const requestCalendarPermissions = requestCalendarAccess;
