import { ScrollView, StyleSheet, View } from 'react-native';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import SilenceStatusCard from '@/components/SilenceStatusCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '@/context/AppContext';
import { getActiveMeeting, getEffectiveEndTime } from '@/lib/schedule';
import { formatMinutes } from '@/lib/time';

export default function HomeScreen() {
  const { data, toggleManualSilence } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const totalRoutineMinutes = data.routines.reduce((sum, item) => sum + item.durationMinutes, 0);
  const activeMeeting = getActiveMeeting(data.schedule);
  const sortedRoutines = [...data.routines].sort((a, b) => a.order - b.order);

  let cursor = 8 * 60;

  return (
    <Screen
      title="QuietRoutine"
      subtitle="Automatic silence by location, calendar, and schedule.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SilenceStatusCard silence={data.silence} />

        <View style={[styles.notice, { backgroundColor: palette.accent, borderColor: palette.border }]}>
          <Text style={styles.noticeTitle}>Always-on status</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>
            A persistent notification shows &quot;Phone is silenced&quot; or &quot;Phone is not silenced&quot; on
            your lock screen and notification shade.
          </Text>
        </View>

        <Button
          title={data.silence.reason?.type === 'manual' ? 'Turn off manual silence' : 'Silence now'}
          onPress={toggleManualSilence}
          variant={data.silence.reason?.type === 'manual' ? 'secondary' : 'primary'}
        />

        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.sectionTitle}>Today at a glance</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>
            {data.zones.filter((zone) => zone.enabled).length} silent zones ·{' '}
            {data.schedule.filter((item) => item.enabled).length} scheduled events ·{' '}
            {formatMinutes(totalRoutineMinutes)} of routines
          </Text>
          {activeMeeting ? (
            <Text style={[styles.highlight, { color: palette.tint }]}>
              Event active: {activeMeeting.title} until {getEffectiveEndTime(activeMeeting)}
            </Text>
          ) : (
            <Text style={[styles.meta, { color: palette.muted }]}>No scheduled silence active right now</Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.sectionTitle}>Routine timeline</Text>
          {sortedRoutines.length === 0 ? (
            <Text style={[styles.meta, { color: palette.muted }]}>
              Add routines to plan your day and see how long each block takes.
            </Text>
          ) : (
            sortedRoutines.map((routine) => {
              const startHour = Math.floor(cursor / 60);
              const startMinute = cursor % 60;
              const startLabel = `${`${startHour}`.padStart(2, '0')}:${`${startMinute}`.padStart(2, '0')}`;
              cursor += routine.durationMinutes;
              const endHour = Math.floor(cursor / 60);
              const endMinute = cursor % 60;
              const endLabel = `${`${endHour}`.padStart(2, '0')}:${`${endMinute}`.padStart(2, '0')}`;
              const linkedZone = data.zones.find((zone) => zone.id === routine.zoneId);

              return (
                <View key={routine.id} style={[styles.timelineRow, { borderColor: palette.border }]}>
                  <View>
                    <Text style={styles.itemTitle}>{routine.name}</Text>
                    <Text style={[styles.meta, { color: palette.muted }]}>
                      {startLabel} – {endLabel} · {formatMinutes(routine.durationMinutes)}
                    </Text>
                    {linkedZone ? (
                      <Text style={[styles.meta, { color: palette.tint }]}>
                        Auto-silence in {linkedZone.name}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>
            Draw a zone on the map or pick a 1m, 10m, or 100m radius. Import Google Calendar events or
            add your own with reminders. QuietRoutine silences automatically and keeps a status
            notification visible at all times.
          </Text>
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
  notice: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
  },
  highlight: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});
