import { ScheduledSilence, SilenceReason } from './types';
import { isTimeWithinRange, todayIsoDate } from './time';

export function getEffectiveEndTime(meeting: ScheduledSilence): string {
  if (!meeting.useCalendarEnd && meeting.customEndTime) {
    return meeting.customEndTime;
  }
  return meeting.endTime;
}

export function getActiveMeeting(
  schedule: ScheduledSilence[],
  now = new Date()
): ScheduledSilence | null {
  const today = todayIsoDate();

  for (const meeting of schedule) {
    if (!meeting.enabled) continue;
    if (meeting.date && meeting.date !== today) continue;

    const endTime = getEffectiveEndTime(meeting);
    if (isTimeWithinRange(now, meeting.startTime, endTime)) {
      return meeting;
    }
  }

  return null;
}

export function meetingSilenceReason(meeting: ScheduledSilence): SilenceReason {
  return {
    type: 'meeting',
    title: meeting.title,
    meetingId: meeting.id,
  };
}

export function meetingEndIso(meeting: ScheduledSilence, now = new Date()): string {
  const endTime = getEffectiveEndTime(meeting);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const end = new Date(now);
  end.setHours(endHour, endMinute, 0, 0);

  const [startHour, startMinute] = meeting.startTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  if (endMinutes <= startMinutes) {
    end.setDate(end.getDate() + 1);
  }

  if (meeting.date) {
    const [year, month, day] = meeting.date.split('-').map(Number);
    end.setFullYear(year, month - 1, day);
    if (endMinutes <= startMinutes) {
      end.setDate(end.getDate() + 1);
    }
  }

  return end.toISOString();
}
