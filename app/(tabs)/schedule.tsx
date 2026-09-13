import { Plus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import AppSwitch from '@/components/AppSwitch';
import Button from '@/components/Button';
import Chip from '@/components/Chip';
import FormField from '@/components/FormField';
import GlassCard from '@/components/GlassCard';
import { HeaderIconButton } from '@/components/GlowTabIcon';
import ScheduleEventRow from '@/components/ScheduleEventRow';
import Screen from '@/components/Screen';
import TimePickerField from '@/components/TimePickerField';
import WeekStrip from '@/components/WeekStrip';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '@/context/AppContext';
import {
  CalendarEventPreview,
  DeviceCalendarInfo,
  calendarEventToScheduledSilence,
  describeCalendarAccess,
  loadUpcomingCalendarEvents,
} from '@/lib/calendar';
import { getEffectiveEndTime } from '@/lib/schedule';
import { createId, parseTimeToMinutes, todayIsoDate } from '@/lib/time';
import { spacing, typography } from '@/constants/theme';
import { ScheduledSilence } from '@/lib/types';

const REMINDER_PRESETS = [0, 5, 15, 30, 60];

export default function ScheduleScreen() {
  const { data, setSchedule, setGoogleCalendarIds } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [selectedDate, setSelectedDate] = useState(() => todayIsoDate());
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:00');
  const [useCalendarEnd, setUseCalendarEnd] = useState(true);
  const [customEndTime, setCustomEndTime] = useState('12:30');
  const [reminderMinutes, setReminderMinutes] = useState(data.settings.defaultReminderMinutes);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventPreview[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarHint, setCalendarHint] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGoogleImport, setShowGoogleImport] = useState(false);
  const [selectableCalendars, setSelectableCalendars] = useState<DeviceCalendarInfo[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>(
    () => data.settings.googleCalendarIds ?? []
  );

  const todayIso = todayIsoDate();
  const isPastSelected = selectedDate < todayIso;

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

  const loadCalendarEvents = async (calendarIds?: string[]) => {
    setLoadingCalendar(true);
    setCalendarError(null);
    setCalendarHint(null);

    const preferredIds = calendarIds ?? selectedCalendarIds;
    const result = await loadUpcomingCalendarEvents({
      preferredCalendarIds: preferredIds,
    });
    setCalendarEvents(result.events);
    setSelectableCalendars(result.selectableCalendars);
    setLoadingCalendar(false);

    if (result.error) {
      setCalendarError(result.error);
      return;
    }

    const accounts =
      result.googleAccountNames.length > 0
        ? result.googleAccountNames.join(', ')
        : 'Google Calendar';

    if (result.events.length === 0) {
      setCalendarHint(
        `Connected to ${accounts} (${result.googleCalendarCount} calendar${result.googleCalendarCount === 1 ? '' : 's'}) — no upcoming events in the next 2 weeks.`
      );
      return;
    }

    setCalendarHint(
      `Connected to ${accounts} · ${result.events.length} Google event${result.events.length === 1 ? '' : 's'} found.`
    );
  };

  const toggleCalendarSelection = async (calendarId: string) => {
    const next = selectedCalendarIds.includes(calendarId)
      ? selectedCalendarIds.filter((id) => id !== calendarId)
      : [...selectedCalendarIds, calendarId];
    setSelectedCalendarIds(next);
    await setGoogleCalendarIds(next);
  };

  const addMeeting = async () => {
    if (selectedDate < todayIsoDate()) {
      Alert.alert('Past day', 'You can only add schedule events for today or future days.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing title', 'Name this event or focus block.');
      return;
    }
    if (!useCalendarEnd && parseTimeToMinutes(customEndTime) <= parseTimeToMinutes(startTime)) {
      Alert.alert('Invalid time range', 'Silence end must be after the start time.');
      return;
    }
    if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
      Alert.alert('Invalid time range', 'End time must be after start time.');
      return;
    }

    const meeting: ScheduledSilence = {
      id: createId('meeting'),
      title: title.trim(),
      startTime,
      endTime,
      date: selectedDate,
      enabled: true,
      useCalendarEnd,
      customEndTime: useCalendarEnd ? undefined : customEndTime,
      reminderMinutes,
      source: 'local',
    };

    await setSchedule([...data.schedule, meeting]);
    setTitle('');
    setShowAddForm(false);
  };

  const importCalendarEvent = async (event: CalendarEventPreview) => {
    const meetingPreview = calendarEventToScheduledSilence(event, data.settings.defaultReminderMinutes);
    if (meetingPreview.date && meetingPreview.date < todayIsoDate()) {
      Alert.alert('Past day', 'You can only add schedule events for today or future days.');
      return;
    }
    const alreadyImported = data.schedule.some((item) => item.externalId === event.externalId);
    if (alreadyImported) {
      Alert.alert('Already added', 'This calendar event is already in your schedule.');
      return;
    }
    await setSchedule([...data.schedule, meetingPreview]);
    if (meetingPreview.date) setSelectedDate(meetingPreview.date);
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
      action={
        <HeaderIconButton
          icon={showAddForm ? X : Plus}
          onPress={() => {
            if (showAddForm) {
              setShowAddForm(false);
              return;
            }
            if (selectedDate < todayIsoDate()) {
              Alert.alert(
                'Past day',
                'You can’t add events on past days. Jump to today to schedule something new?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Go to today',
                    onPress: () => {
                      setSelectedDate(todayIsoDate());
                      setShowAddForm(true);
                    },
                  },
                ]
              );
              return;
            }
            setShowAddForm(true);
          }}
        />
      }>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <WeekStrip
          selectedDate={selectedDate}
          markedDates={markedDates}
          onSelectDate={(iso) => {
            setSelectedDate(iso);
            if (iso < todayIsoDate()) {
              setShowAddForm(false);
            }
          }}
        />

        <View style={styles.list}>
          {eventsForSelectedDay.length === 0 ? (
            <Text style={[styles.empty, { color: palette.muted }]}>
              {isPastSelected
                ? 'Past days are view-only — you can’t add new events here.'
                : 'No events this day. Tap + to add a focus session.'}</Text>
          ) : (
            eventsForSelectedDay.map((meeting) => (
              <ScheduleEventRow
                key={meeting.id}
                title={meeting.title}
                startTime={meeting.startTime}
                endTime={getEffectiveEndTime(meeting)}
                enabled={meeting.enabled}
                onToggle={(value) => toggleMeeting(meeting.id, value)}
                onLongPress={() => {
                  Alert.alert('Delete event', `Remove “${meeting.title}”?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        removeMeeting(meeting.id).catch(console.error);
                      },
                    },
                  ]);
                }}
              />
            ))
          )}
        </View>

        {showAddForm && !isPastSelected ? (
          <GlassCard contentStyle={styles.form}>
            <Text style={[styles.formTitle, { color: palette.text }]}>New event</Text>
            <FormField
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="Focus session..."
            />
            <View style={styles.timeColumn}>
              <TimePickerField label="Starts" value={startTime} onChange={setStartTime} />
              <TimePickerField label="Ends" value={endTime} onChange={setEndTime} />
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: palette.text }]}>Use event end time</Text>
              <AppSwitch value={useCalendarEnd} onValueChange={setUseCalendarEnd} />
            </View>
            {!useCalendarEnd ? (
              <TimePickerField label="Silence ends" value={customEndTime} onChange={setCustomEndTime} />
            ) : null}
            <Text style={[styles.switchLabel, { color: palette.muted }]}>Alarm before</Text>
            <View style={styles.chipRow}>
              {REMINDER_PRESETS.map((preset) => (
                <Chip
                  key={preset}
                  label={preset === 0 ? 'Off' : `${preset}m`}
                  active={reminderMinutes === preset}
                  onPress={() => setReminderMinutes(preset)}
                />
              ))}
            </View>
            <Button title="Save event" onPress={addMeeting} />
          </GlassCard>
        ) : null}

        <GlassCard compact contentStyle={styles.importCard}>
          <Pressable onPress={() => setShowGoogleImport((value) => !value)} style={styles.importHeader}>
            <Text style={[styles.formTitle, { color: palette.text }]}>Google Calendar</Text>
            <Text style={{ color: palette.tint, fontWeight: '600' }}>
              {showGoogleImport ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
          {showGoogleImport ? (
            <>
              <Text style={[styles.empty, { color: palette.muted }]}>{describeCalendarAccess()}</Text>
              {calendarError ? (
                <Text style={[styles.empty, { color: palette.danger }]}>{calendarError}</Text>
              ) : null}
              {calendarHint && !calendarError ? (
                <Text style={[styles.empty, { color: palette.success }]}>{calendarHint}</Text>
              ) : null}
              {selectableCalendars.length > 0 ? (
                <View style={styles.calendarPicker}>
                  <Text style={[styles.switchLabel, { color: palette.text }]}>
                    Choose Google calendars (never On My iPhone)
                  </Text>
                  {selectableCalendars.map((calendar) => {
                    const selected = selectedCalendarIds.includes(calendar.id);
                    return (
                      <Pressable
                        key={calendar.id}
                        onPress={() => {
                          toggleCalendarSelection(calendar.id).catch(console.error);
                        }}
                        style={[
                          styles.calendarOption,
                          {
                            borderColor: selected ? palette.tint : palette.border,
                            backgroundColor: selected ? palette.iceTint : palette.card,
                          },
                        ]}>
                        <Text style={[styles.switchLabel, { color: palette.text }]}>
                          {calendar.title}
                          {calendar.kind === 'google' ? ' · Google' : ''}
                        </Text>
                        <Text style={[styles.empty, { color: palette.muted }]}>
                          {calendar.accountName} · {calendar.sourceName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
              <Button
                title={loadingCalendar ? 'Connecting to Google…' : 'Import from Google Calendar'}
                variant="secondary"
                onPress={() => loadCalendarEvents()}
                disabled={loadingCalendar}
              />
              {calendarEvents.slice(0, 8).map((event) => (
                <View key={event.externalId} style={styles.importRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.switchLabel, { color: palette.text }]}>{event.title}</Text>
                    <Text style={[styles.empty, { color: palette.muted }]}>
                      {event.startDate.toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {` · ${event.calendarTitle}`}
                      {event.accountName ? ` · ${event.accountName}` : ''}
                    </Text>
                  </View>
                  <Button title="Add" onPress={() => importCalendarEvent(event)} />
                </View>
              ))}
            </>
          ) : null}
        </GlassCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: 120,
  },
  list: {
    gap: spacing.md,
  },
  empty: {
    ...typography.body,
    fontSize: 14,
    paddingHorizontal: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  formTitle: {
    ...typography.heading,
  },
  timeColumn: {
    gap: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    ...typography.label,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  importCard: {
    gap: spacing.md,
  },
  importHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  calendarPicker: {
    gap: spacing.sm,
  },
  calendarOption: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
});
