import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ScheduledSilence } from './types';
import { ensureNotificationPermissions, setupNotificationChannel } from './silence';

export const ALARM_CHANNEL_ID = 'event-alarms';

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
  await setupReminderChannel();

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
        title: `⏰ ${meeting.title} starts soon`,
        body: `Starts in ${meeting.reminderMinutes} minutes — switch your phone to silent now.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 500, 200, 500, 200, 500],
        data: { type: 'alarm' },
        ...(Platform.OS === 'android' ? { channelId: ALARM_CHANNEL_ID } : {}),
        ...(Platform.OS === 'ios' ? { interruptionLevel: 'timeSensitive' as const } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerAt),
      },
    });
  }
}

export async function setupReminderChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: 'Event alarms',
    description: 'Loud reminders before scheduled events',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
    enableVibrate: true,
    sound: 'default',
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
  });
}
