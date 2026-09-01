import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import Button from '@/components/Button';
import FormField from '@/components/FormField';
import Screen from '@/components/Screen';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '@/context/AppContext';
import {
  CalendarEventPreview,
  calendarEventToScheduledSilence,
  describeCalendarAccess,
  fetchUpcomingCalendarEvents,
  requestCalendarPermissions,
} from '@/lib/calendar';
import { getEffectiveEndTime } from '@/lib/schedule';
import { createId, formatDurationBetween, todayIsoDate } from '@/lib/time';
import { ScheduledSilence } from '@/lib/types';

const REMINDER_PRESETS = [0, 5, 15, 30, 60];

export default function ScheduleScreen() {
  const { data, setSchedule } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:00');
  const [useCalendarEnd, setUseCalendarEnd] = useState(true);
  const [customEndTime, setCustomEndTime] = useState('12:30');
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [customReminder, setCustomReminder] = useState('');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventPreview[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const loadCalendarEvents = async () => {
    setLoadingCalendar(true);
    const granted = await requestCalendarPermissions();
    if (!granted) {
      Alert.alert('Calendar access needed', 'Allow calendar access to import Google Calendar events.');
      setLoadingCalendar(false);
      return;
    }

    const events = await fetchUpcomingCalendarEvents();
    setCalendarEvents(events);
    setLoadingCalendar(false);
  };

  useEffect(() => {
    loadCalendarEvents().catch(console.error);
  }, []);

  const addMeeting = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Name this event or focus block.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD format.');
      return;
    }

    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      Alert.alert('Invalid time', 'Use 24-hour format like 11:00 or 23:30.');
      return;
    }

    if (!useCalendarEnd && !/^\d{2}:\d{2}$/.test(customEndTime)) {
      Alert.alert('Invalid custom end', 'Custom end time must be HH:MM.');
      return;
    }

    const reminder = customReminder ? Math.max(0, Number(customReminder) || 0) : reminderMinutes;

    const meeting: ScheduledSilence = {
      id: createId('meeting'),
      title: title.trim(),
      startTime,
      endTime,
      date,
      enabled: true,
      useCalendarEnd,
      customEndTime: useCalendarEnd ? undefined : customEndTime,
      reminderMinutes: reminder,
      source: 'local',
    };

    await setSchedule([...data.schedule, meeting]);
    setTitle('');
    setDate(todayIsoDate());
    setStartTime('11:00');
    setEndTime('12:00');
    setUseCalendarEnd(true);
    setCustomEndTime('12:30');
    setCustomReminder('');
    setReminderMinutes(30);
  };

  const importCalendarEvent = async (event: CalendarEventPreview) => {
    const alreadyImported = data.schedule.some((item) => item.externalId === event.externalId);
    if (alreadyImported) {
      Alert.alert('Already added', 'This calendar event is already in your silence schedule.');
      return;
    }

    const meeting = calendarEventToScheduledSilence(event, data.settings.defaultReminderMinutes);
    await setSchedule([...data.schedule, meeting]);
  };

  const toggleMeeting = async (meetingId: string, enabled: boolean) => {
    await setSchedule(
      data.schedule.map((meeting) => (meeting.id === meetingId ? { ...meeting, enabled } : meeting))
    );
  };

  const removeMeeting = async (meetingId: string) => {
    await setSchedule(data.schedule.filter((meeting) => meeting.id !== meetingId));
  };

  return (
    <Screen
      title="Schedule"
      subtitle="Built-in calendar events and Google Calendar routines that silence your phone automatically.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.cardTitle}>Google Calendar</Text>
          <Text style={[styles.helper, { color: palette.muted }]}>{describeCalendarAccess()}</Text>
          <Button
            title={loadingCalendar ? 'Loading events...' : 'Refresh calendar events'}
            variant="secondary"
            onPress={loadCalendarEvents}
          />
          {calendarEvents.length === 0 ? (
            <Text style={[styles.helper, { color: palette.muted }]}>
              No upcoming events found. You can still use the built-in calendar below.
            </Text>
          ) : (
            calendarEvents.slice(0, 8).map((event) => (
              <View key={event.externalId} style={[styles.importRow, { borderColor: palette.border }]}>
                <View style={styles.textBlock}>
                  <Text style={styles.itemTitle}>{event.title}</Text>
                  <Text style={[styles.meta, { color: palette.muted }]}>
                    {event.startDate.toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    · {event.calendarTitle}
                  </Text>
                </View>
                <Button title="Silence" onPress={() => importCalendarEvent(event)} />
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.cardTitle}>Built-in calendar</Text>
          <Text style={[styles.helper, { color: palette.muted }]}>
            Set start and end times. QuietRoutine reminds you before the event and silences automatically.
          </Text>
          <FormField label="Title" value={title} onChangeText={setTitle} placeholder="Team sync, class, focus..." />
          <FormField
            label="Date (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            keyboardType="numbers-and-punctuation"
            placeholder={todayIsoDate()}
          />
          <FormField
            label="Starts (HH:MM)"
            value={startTime}
            onChangeText={setStartTime}
            keyboardType="numbers-and-punctuation"
            placeholder="11:00"
          />
          <FormField
            label="Calendar end (HH:MM)"
            value={endTime}
            onChangeText={setEndTime}
            keyboardType="numbers-and-punctuation"
            placeholder="12:00"
          />

          <View style={styles.switchRow}>
            <View style={styles.textBlock}>
              <Text style={styles.switchLabel}>Use calendar end time</Text>
              <Text style={[styles.meta, { color: palette.muted }]}>
                Turn off to set a custom silence end time.
              </Text>
            </View>
            <Switch value={useCalendarEnd} onValueChange={setUseCalendarEnd} />
          </View>

          {!useCalendarEnd ? (
            <FormField
              label="Custom silence ends (HH:MM)"
              value={customEndTime}
              onChangeText={setCustomEndTime}
              keyboardType="numbers-and-punctuation"
              placeholder="12:30"
            />
          ) : null}

          <Text style={[styles.label, { color: palette.muted }]}>Reminder before event</Text>
          <View style={styles.chipRow}>
            {REMINDER_PRESETS.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => {
                  setReminderMinutes(preset);
                  setCustomReminder('');
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      reminderMinutes === preset && !customReminder ? palette.tint : palette.card,
                    borderColor: palette.border,
                  },
                ]}>
                <Text
                  style={{
                    color: reminderMinutes === preset && !customReminder ? '#FFF' : palette.text,
                    fontWeight: '600',
                    fontSize: 13,
                  }}>
                  {preset === 0 ? 'Off' : `${preset}m`}
                </Text>
              </Pressable>
            ))}
          </View>
          <FormField
            label="Custom reminder (minutes before)"
            value={customReminder}
            onChangeText={setCustomReminder}
            keyboardType="numeric"
            placeholder="45"
          />

          <Button title="Save event" onPress={addMeeting} />
        </View>

        {data.schedule.length === 0 ? (
          <Text style={[styles.empty, { color: palette.muted }]}>
            No scheduled silence yet. Import from Google Calendar or add your own events.
          </Text>
        ) : (
          data.schedule.map((meeting) => {
            const effectiveEnd = getEffectiveEndTime(meeting);
            return (
              <View
                key={meeting.id}
                style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <View style={styles.row}>
                  <View style={styles.textBlock}>
                    <Text style={styles.itemTitle}>{meeting.title}</Text>
                    <Text style={[styles.meta, { color: palette.muted }]}>
                      {meeting.date ?? 'Daily'} · {meeting.startTime} – {effectiveEnd}
                      {!meeting.useCalendarEnd ? ' (custom end)' : ''}
                    </Text>
                    <Text style={[styles.meta, { color: palette.muted }]}>
                      {formatDurationBetween(meeting.startTime, effectiveEnd)} silenced · reminder{' '}
                      {meeting.reminderMinutes > 0 ? `${meeting.reminderMinutes}m before` : 'off'}
                      {meeting.source === 'google' ? ' · Google Calendar' : ''}
                    </Text>
                  </View>
                  <Switch value={meeting.enabled} onValueChange={(value) => toggleMeeting(meeting.id, value)} />
                </View>
                <Button title="Remove" variant="danger" onPress={() => removeMeeting(meeting.id)} />
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  helper: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
});
