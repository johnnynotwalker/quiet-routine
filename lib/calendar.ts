import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

import { ScheduledSilence } from './types';
import { createId, todayIsoDate } from './time';

export type DeviceCalendar = Awaited<ReturnType<typeof Calendar.getCalendarsAsync>>[number];

export type CalendarEventPreview = {
  externalId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  calendarTitle: string;
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

export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function getWritableCalendars(): Promise<DeviceCalendar[]> {
  const granted = await requestCalendarPermissions();
  if (!granted) return [];

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars.filter((calendar) => calendar.allowsModifications || calendar.source?.name);
}

export async function fetchUpcomingCalendarEvents(daysAhead = 14): Promise<CalendarEventPreview[]> {
  const granted = await requestCalendarPermissions();
  if (!granted) return [];

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  if (calendars.length === 0) return [];

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + daysAhead);

  const events = await Calendar.getEventsAsync(
    calendars.map((calendar) => calendar.id),
    start,
    end
  );

  return events
    .filter((event) => !event.allDay)
    .map((event) => {
      const calendar = calendars.find((item) => item.id === event.calendarId);
      return {
        externalId: event.id,
        title: event.title || 'Untitled event',
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        calendarTitle: calendar?.title ?? calendar?.source?.name ?? 'Calendar',
      };
    })
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
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

export function isGoogleCalendarSource(calendar: DeviceCalendar): boolean {
  const sourceName = calendar.source?.name?.toLowerCase() ?? '';
  const sourceType = calendar.source?.type?.toLowerCase() ?? '';

  if (Platform.OS === 'android') {
    return sourceName.includes('google') || sourceType.includes('com.google');
  }

  return sourceName.includes('google') || sourceType.includes('google');
}

export async function getGoogleLinkedCalendars(): Promise<DeviceCalendar[]> {
  const calendars = await getWritableCalendars();
  return calendars.filter(isGoogleCalendarSource);
}

export function describeCalendarAccess(): string {
  if (Platform.OS === 'android') {
    return 'Connect to your Google Calendar (or any calendar on this device) to auto-silence during meetings and routines.';
  }

  return 'Connect to calendars synced on this iPhone — including Google Calendar if you added it in Settings.';
}
