import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ScheduledSilence } from './types';
import { ensureNotificationPermissions, setupNotificationChannel } from './silence';

function reminderId(meetingId: string): string {
  return `quietroutine-reminder-${meetingId}`;
}

function eventStartDate(meeting: ScheduledSilence): Date | null {
  if (!meeting.date) return null;

  const [year, month, day] = meeting.date.split('-').map(Number);
  const [hours, minutes] = meeting.startTime.split(':').map(Number);
  const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(start.getTime()) ? null : start;
}

export async function syncEventReminders(schedule: ScheduledSilence[]): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  await setupNotificationChannel();

  const activeIds = new Set(schedule.filter((item) => item.enabled).map((item) => reminderId(item.id)));
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of scheduled) {
    if (notification.identifier.startsWith('quietroutine-reminder-') && !activeIds.has(notification.identifier)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  const now = Date.now();

  for (const meeting of schedule) {
    if (!meeting.enabled || meeting.reminderMinutes <= 0) continue;

    const start = eventStartDate(meeting);
    if (!start) continue;

    const triggerAt = start.getTime() - meeting.reminderMinutes * 60_000;
    if (triggerAt <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: reminderId(meeting.id),
      content: {
        title: `${meeting.title} starts soon`,
        body: `QuietRoutine will silence your phone in ${meeting.reminderMinutes} minutes.`,
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'event-reminders' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerAt),
      },
    });
  }
}

export async function setupReminderChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('event-reminders', {
      name: 'Event Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}
