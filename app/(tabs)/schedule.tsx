import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import Button from '@/components/Button';
import FormField from '@/components/FormField';
import MiniCalendar from '@/components/MiniCalendar';
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
import { parseIsoDate, todayParts } from '@/lib/calendar-ui';
import { getEffectiveEndTime } from '@/lib/schedule';
import { createId, formatDurationBetween, todayIsoDate } from '@/lib/time';
import { ScheduledSilence } from '@/lib/types';

const REMINDER_PRESETS = [0, 5, 15, 30, 60];

export default function ScheduleScreen() {
  const { data, setSchedule } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const initial = todayParts();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:00');
  const [useCalendarEnd, setUseCalendarEnd] = useState(true);
  const [customEndTime, setCustomEndTime] = useState('12:30');
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [customReminder, setCustomReminder] = useState('');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventPreview[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGoogleImport, setShowGoogleImport] = useState(false);

  const markedDates = useMemo(() => {
    const dates = new Set<string>();
    for (const item of data.schedule) {
      if (item.date) dates.add(item.date);
    }
    return dates;
  }, [data.schedule]);

  const eventsForSelectedDay = useMemo(
    () =>
      data.schedule
        .filter((item) => item.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [data.schedule, selectedDate]
  );

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

  const handleSelectDate = (iso: string) => {
    setSelectedDate(iso);
    const parts = parseIsoDate(iso);
    setYear(parts.year);
    setMonth(parts.month);
  };

  const handleMonthChange = (nextYear: number, nextMonth: number) => {
    setYear(nextYear);
    setMonth(nextMonth);
  };

  const addMeeting = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Name this event or focus block.');
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
      date: selectedDate,
      enabled: true,
      useCalendarEnd,
      customEndTime: useCalendarEnd ? undefined : customEndTime,
      reminderMinutes: reminder,
      source: 'local',
    };

    await setSchedule([...data.schedule, meeting]);
    setTitle('');
    setStartTime('11:00');
    setEndTime('12:00');
    setUseCalendarEnd(true);
    setCustomEndTime('12:30');
    setCustomReminder('');
    setReminderMinutes(30);
    setShowAddForm(false);
  };

  const importCalendarEvent = async (event: CalendarEventPreview) => {
    const alreadyImported = data.schedule.some((item) => item.externalId === event.externalId);
    if (alreadyImported) {
      Alert.alert('Already added', 'This calendar event is already in your schedule.');
      return;
    }

    const meeting = calendarEventToScheduledSilence(event, data.settings.defaultReminderMinutes);
    await setSchedule([...data.schedule, meeting]);
    if (meeting.date) handleSelectDate(meeting.date);
  };

  const toggleMeeting = async (meetingId: string, enabled: boolean) => {
    await setSchedule(
      data.schedule.map((meeting) => (meeting.id === meetingId ? { ...meeting, enabled } : meeting))
    );
  };

  const removeMeeting = async (meetingId: string) => {
    await setSchedule(data.schedule.filter((meeting) => meeting.id !== meetingId));
  };

  const selectedLabel = new Date(
    parseIsoDate(selectedDate).year,
    parseIsoDate(selectedDate).month - 1,
    parseIsoDate(selectedDate).day
  ).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Screen
      title="Calendar"
      subtitle="Mini calendar with event alarms and optional Google Calendar import.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MiniCalendar
          year={year}
          month={month}
          selectedDate={selectedDate}
          markedDates={markedDates}
          onMonthChange={handleMonthChange}
          onSelectDate={handleSelectDate}
        />

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>{selectedLabel}</Text>
            <Button title={showAddForm ? 'Cancel' : 'Add event'} onPress={() => setShowAddForm((v) => !v)} />
          </View>

          {eventsForSelectedDay.length === 0 ? (
            <Text style={[styles.helper, { color: palette.muted }]}>
              No events on this day. Tap Add event to schedule silence and an alarm reminder.
            </Text>
          ) : (
            eventsForSelectedDay.map((meeting) => {
              const effectiveEnd = getEffectiveEndTime(meeting);
              return (
                <View key={meeting.id} style={[styles.eventRow, { borderColor: palette.border }]}>
                  <View style={styles.textBlock}>
                    <Text style={styles.itemTitle}>{meeting.title}</Text>
                    <Text style={[styles.meta, { color: palette.muted }]}>
                      {meeting.startTime} – {effectiveEnd}
                      {!meeting.useCalendarEnd ? ' (custom end)' : ''}
                    </Text>
                    <Text style={[styles.meta, { color: palette.muted }]}>
                      {formatDurationBetween(meeting.startTime, effectiveEnd)} · alarm{' '}
                      {meeting.reminderMinutes > 0 ? `${meeting.reminderMinutes}m before` : 'off'}
                      {meeting.source === 'google' ? ' · Google' : ''}
                    </Text>
                  </View>
                  <Switch value={meeting.enabled} onValueChange={(value) => toggleMeeting(meeting.id, value)} />
                  <Button title="Remove" variant="danger" onPress={() => removeMeeting(meeting.id)} />
                </View>
              );
            })
          )}
        </View>

        {showAddForm ? (
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={styles.cardTitle}>New event on {selectedDate}</Text>
            <FormField label="Title" value={title} onChangeText={setTitle} placeholder="Class, meeting, focus..." />
            <FormField
              label="Starts (HH:MM)"
              value={startTime}
              onChangeText={setStartTime}
              keyboardType="numbers-and-punctuation"
              placeholder="11:00"
            />
            <FormField
              label="Ends (HH:MM)"
              value={endTime}
              onChangeText={setEndTime}
              keyboardType="numbers-and-punctuation"
              placeholder="12:00"
            />

            <View style={styles.switchRow}>
              <View style={styles.textBlock}>
                <Text style={styles.switchLabel}>Use event end time</Text>
                <Text style={[styles.meta, { color: palette.muted }]}>Turn off to set a custom silence end.</Text>
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

            <Text style={[styles.label, { color: palette.muted }]}>Alarm before event</Text>
            <Text style={[styles.helper, { color: palette.muted }]}>
              Plays a loud sound and vibrates — not just a quiet notification.
            </Text>
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
              label="Custom alarm (minutes before)"
              value={customReminder}
              onChangeText={setCustomReminder}
              keyboardType="numeric"
              placeholder="45"
            />

            <Button title="Save event" onPress={addMeeting} />
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Pressable onPress={() => setShowGoogleImport((v) => !v)} style={styles.row}>
            <Text style={styles.cardTitle}>Google Calendar</Text>
            <Text style={{ color: palette.tint, fontWeight: '600' }}>{showGoogleImport ? 'Hide' : 'Show'}</Text>
          </Pressable>
          {showGoogleImport ? (
            <>
              <Text style={[styles.helper, { color: palette.muted }]}>{describeCalendarAccess()}</Text>
              <Button
                title={loadingCalendar ? 'Loading events...' : 'Refresh calendar events'}
                variant="secondary"
                onPress={loadCalendarEvents}
              />
              {calendarEvents.length === 0 ? (
                <Text style={[styles.helper, { color: palette.muted }]}>No upcoming events found.</Text>
              ) : (
                calendarEvents.slice(0, 10).map((event) => (
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
                    <Button title="Add" onPress={() => importCalendarEvent(event)} />
                  </View>
                ))
              )}
            </>
          ) : null}
        </View>
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
    flex: 1,
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
  eventRow: {
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 12,
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
});
