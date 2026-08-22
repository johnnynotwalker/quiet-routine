import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';

import Button from '@/components/Button';
import FormField from '@/components/FormField';
import Screen from '@/components/Screen';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '@/context/AppContext';
import { createId, formatDurationBetween } from '@/lib/time';
import { ScheduledSilence } from '@/lib/types';

export default function ScheduleScreen() {
  const { data, setSchedule } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:00');

  const addMeeting = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Name this meeting or focus block.');
      return;
    }

    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      Alert.alert('Invalid time', 'Use 24-hour format like 11:00 or 23:30.');
      return;
    }

    const meeting: ScheduledSilence = {
      id: createId('meeting'),
      title: title.trim(),
      startTime,
      endTime,
      enabled: true,
    };

    await setSchedule([...data.schedule, meeting]);
    setTitle('');
    setStartTime('11:00');
    setEndTime('12:00');
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
      subtitle="Meetings and focus blocks that silence your phone for the exact duration.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.cardTitle}>Add scheduled silence</Text>
          <Text style={[styles.helper, { color: palette.muted }]}>
            Example: a meeting from 11:00 to 12:00 silences your phone automatically for one hour.
          </Text>
          <FormField label="Title" value={title} onChangeText={setTitle} placeholder="Team sync, client call..." />
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
          <Button title="Save schedule" onPress={addMeeting} />
        </View>

        {data.schedule.length === 0 ? (
          <Text style={[styles.empty, { color: palette.muted }]}>
            No scheduled silence yet. Add your next meeting and QuietRoutine handles the quiet hour for you.
          </Text>
        ) : (
          data.schedule.map((meeting) => (
            <View
              key={meeting.id}
              style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={styles.row}>
                <View style={styles.textBlock}>
                  <Text style={styles.itemTitle}>{meeting.title}</Text>
                  <Text style={[styles.meta, { color: palette.muted }]}>
                    {meeting.startTime} – {meeting.endTime} ·{' '}
                    {formatDurationBetween(meeting.startTime, meeting.endTime)} silenced
                  </Text>
                </View>
                <Switch value={meeting.enabled} onValueChange={(value) => toggleMeeting(meeting.id, value)} />
              </View>
              <Button title="Remove" variant="danger" onPress={() => removeMeeting(meeting.id)} />
            </View>
          ))
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
});
