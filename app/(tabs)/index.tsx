import { ScrollView, StyleSheet, View, Platform } from 'react-native';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import SilenceLimitationsCard from '@/components/SilenceLimitationsCard';
import SilenceStatusCard from '@/components/SilenceStatusCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '@/context/AppContext';
import { getActiveMeeting, getEffectiveEndTime } from '@/lib/schedule';
import { todayIsoDate } from '@/lib/time';

export default function HomeScreen() {
  const { data, toggleManualSilence } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const activeMeeting = getActiveMeeting(data.schedule);
  const today = todayIsoDate();
  const todayEvents = data.schedule
    .filter((item) => item.enabled && item.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Screen title="QuietRoutine" subtitle="Silence by location and calendar — with loud event alarms.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SilenceStatusCard silence={data.silence} />

        <SilenceLimitationsCard />

        <View style={[styles.notice, { backgroundColor: palette.accent, borderColor: palette.border }]}>
          <Text style={styles.noticeTitle}>Status notification</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>
            {Platform.OS === 'android'
              ? 'A pinned foreground-service notification shows silence mode and cannot be swiped away.'
              : 'QuietRoutine re-posts the status notification if you remove it, but iPhone always allows clearing notifications.'}
          </Text>
        </View>

        <Button
          title={data.silence.reason?.type === 'manual' ? 'Turn off reminder mode' : 'Mark as should be silent'}
          onPress={toggleManualSilence}
          variant={data.silence.reason?.type === 'manual' ? 'secondary' : 'primary'}
        />

        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.sectionTitle}>Today on your calendar</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>
            {data.zones.filter((zone) => zone.enabled).length} silent zones ·{' '}
            {data.schedule.filter((item) => item.enabled).length} scheduled events
          </Text>
          {activeMeeting ? (
            <Text style={[styles.highlight, { color: palette.tint }]}>
              Active now: {activeMeeting.title} until {getEffectiveEndTime(activeMeeting)}
            </Text>
          ) : (
            <Text style={[styles.meta, { color: palette.muted }]}>No active silence window right now</Text>
          )}
          {todayEvents.length > 0 ? (
            todayEvents.map((event) => (
              <View key={event.id} style={[styles.eventRow, { borderColor: palette.border }]}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={[styles.meta, { color: palette.muted }]}>
                  {event.startTime} – {getEffectiveEndTime(event)}
                  {event.reminderMinutes > 0 ? ` · alarm ${event.reminderMinutes}m before` : ''}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.meta, { color: palette.muted }]}>No events today — open Calendar to add one.</Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>
            Draw a zone on the map with a custom radius, or import Google Calendar events. Before each event,
            QuietRoutine fires a loud alarm reminder. For real automatic ringer control, install a production build
            (Expo Go cannot change iOS silent mode).
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
  eventRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 2,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
});
