import { ScheduledSilence, SilenceReason } from './types';
import { isTimeWithinRange, todayIsoDate } from './time';

export function getActiveMeeting(
  schedule: ScheduledSilence[],
  now = new Date()
): ScheduledSilence | null {
  const today = todayIsoDate();

  for (const meeting of schedule) {
    if (!meeting.enabled) continue;
    if (meeting.date && meeting.date !== today) continue;
    if (isTimeWithinRange(now, meeting.startTime, meeting.endTime)) {
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
  const [endHour, endMinute] = meeting.endTime.split(':').map(Number);
  const end = new Date(now);
  end.setHours(endHour, endMinute, 0, 0);

  const [startHour, startMinute] = meeting.startTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  if (endMinutes <= startMinutes) {
    end.setDate(end.getDate() + 1);
  }

  return end.toISOString();
}
