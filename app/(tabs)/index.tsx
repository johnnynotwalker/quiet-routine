import { useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';

import Button from '@/components/Button';
import GlassCard from '@/components/GlassCard';
import LockScreenStatusCard from '@/components/LockScreenStatusCard';
import Screen from '@/components/Screen';
import SilenceLimitationsCard from '@/components/SilenceLimitationsCard';
import SilenceStatusCard from '@/components/SilenceStatusCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { spacing, typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import {
  canShowOnLockScreen,
  getStatusNotificationPermissions,
  hasNotificationAccess,
} from '@/lib/notification-permissions';
import { getActiveMeeting, getEffectiveEndTime } from '@/lib/schedule';
import { todayIsoDate } from '@/lib/time';

export default function HomeScreen() {
  const { data, toggleManualSilence } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [lockScreenReady, setLockScreenReady] = useState(false);

  const refreshPermissionState = async () => {
    const settings = await getStatusNotificationPermissions();
    setNotificationsGranted(hasNotificationAccess(settings));
    setLockScreenReady(canShowOnLockScreen(settings));
  };

  useEffect(() => {
    refreshPermissionState().catch(console.error);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshPermissionState().catch(console.error);
      }
    });
    return () => subscription.remove();
  }, []);

  const activeMeeting = getActiveMeeting(data.schedule);
  const today = todayIsoDate();
  const todayEvents = data.schedule
    .filter((item) => item.enabled && item.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Screen title="QuietRoutine" subtitle="Calm silence, right on your lock screen.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.upper}>
          <SilenceStatusCard silence={data.silence} />
        </View>

        <View style={styles.lower}>
          <LockScreenStatusCard
            lockScreenReady={lockScreenReady}
            notificationsGranted={notificationsGranted}
          />

          <Button
            title={data.silence.reason?.type === 'manual' ? 'Turn off reminder mode' : 'Mark as should be silent'}
            onPress={toggleManualSilence}
            variant={data.silence.reason?.type === 'manual' ? 'secondary' : 'primary'}
          />

          <GlassCard contentStyle={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Today</Text>
            <Text style={[styles.meta, { color: palette.muted }]}>
              {data.zones.filter((zone) => zone.enabled).length} zones ·{' '}
              {data.schedule.filter((item) => item.enabled).length} events
            </Text>
            {activeMeeting ? (
              <Text style={[styles.highlight, { color: palette.tint }]}>
                Active: {activeMeeting.title} until {getEffectiveEndTime(activeMeeting)}
              </Text>
            ) : (
              <Text style={[styles.meta, { color: palette.muted }]}>No active silence window</Text>
            )}
            {todayEvents.length > 0 ? (
              todayEvents.map((event) => (
                <View key={event.id} style={styles.eventRow}>
                  <Text style={[styles.eventTitle, { color: palette.text }]}>{event.title}</Text>
                  <Text style={[styles.meta, { color: palette.muted }]}>
                    {event.startTime} – {getEffectiveEndTime(event)}
                    {event.reminderMinutes > 0 ? ` · alarm ${event.reminderMinutes}m before` : ''}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.meta, { color: palette.muted }]}>No events today — open Calendar to add one.</Text>
            )}
          </GlassCard>

          <SilenceLimitationsCard />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  upper: {
    gap: spacing.lg,
  },
  lower: {
    flex: 1,
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
  },
  meta: {
    ...typography.body,
    fontSize: 14,
  },
  highlight: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventRow: {
    gap: 2,
    marginTop: spacing.sm,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
});
