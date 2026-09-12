import { Bell } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Linking, ScrollView, StyleSheet, View } from 'react-native';

import { HeaderIconButton } from '@/components/GlowTabIcon';
import Screen from '@/components/Screen';
import SilenceLimitationsCard from '@/components/SilenceLimitationsCard';
import StatusHeroCard from '@/components/StatusHeroCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { spacing, typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import {
  canShowOnLockScreen,
  getStatusNotificationPermissions,
  hasNotificationAccess,
  lockScreenSettingsHint,
} from '@/lib/notification-permissions';
import { getActiveMeeting, getEffectiveEndTime } from '@/lib/schedule';
import { formatPauseRemaining, isSilencePaused } from '@/lib/silence';
import { formatTimeLabel, todayIsoDate } from '@/lib/time';

function formatNowClock(now: Date): string {
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const date = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return `It's now ${time} · ${date}`;
}

export default function HomeScreen() {
  const { data, toggleManualSilence } = useApp();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [lockScreenReady, setLockScreenReady] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const refreshPermissionState = async () => {
    const settings = await getStatusNotificationPermissions();
    setLockScreenReady(canShowOnLockScreen(settings) && hasNotificationAccess(settings));
  };

  useEffect(() => {
    refreshPermissionState().catch(console.error);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(new Date());
        refreshPermissionState().catch(console.error);
      }
    });
    return () => subscription.remove();
  }, []);

  const paused = isSilencePaused(data.silence, now);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), paused ? 1_000 : 30_000);
    return () => clearInterval(interval);
  }, [paused]);

  const activeMeeting = getActiveMeeting(data.schedule);
  const today = todayIsoDate();
  const nowSubtitle = formatNowClock(now);
  const nextEvent = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return data.schedule
      .filter((item) => item.enabled && item.date === today)
      .filter((item) => {
        const [hours, minutes] = item.startTime.split(':').map(Number);
        return hours * 60 + minutes >= currentMinutes;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  }, [data.schedule, today]);

  const activeZoneName =
    data.silence.reason?.type === 'zone' ? data.silence.reason.zoneName : undefined;

  const silenceTimeRange = useMemo(() => {
    if (activeMeeting) {
      return `${formatTimeLabel(activeMeeting.startTime)} – ${formatTimeLabel(getEffectiveEndTime(activeMeeting))}`;
    }
    if (data.silence.until) {
      const until = new Date(data.silence.until);
      const now = new Date();
      return `${formatTimeLabel(`${now.getHours()}:${`${now.getMinutes()}`.padStart(2, '0')}`)} – ${until.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
    return undefined;
  }, [activeMeeting, data.silence.until]);

  const pauseDetail = paused && data.silence.pausedUntil
    ? `Do Not Disturb stays off · ${formatPauseRemaining(data.silence.pausedUntil, now)} left`
    : null;

  const primaryLabel = paused
    ? 'Resume silence now'
    : data.silence.isSilenced
      ? 'Pause Silence (30m)'
      : 'Start Silence Mode';

  return (
    <Screen
      variant="greeting"
      greeting="Welcome back"
      subtitle={nowSubtitle}
      title=""
      action={<HeaderIconButton icon={Bell} onPress={() => Linking.openSettings()} />}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StatusHeroCard
          silence={data.silence}
          zoneLabel={activeZoneName}
          timeRange={silenceTimeRange}
          primaryLabel={primaryLabel}
          onPrimaryAction={toggleManualSilence}
          pauseDetail={pauseDetail}
        />

        <SilenceLimitationsCard />

        <View style={styles.nextBlock}>
          <Text style={[styles.nextTitle, { color: palette.text }]}>
            Next{nextEvent ? `: ${nextEvent.title}` : ''}
          </Text>
          <Text style={[styles.nextMeta, { color: palette.muted }]}>
            {nextEvent
              ? `${formatTimeLabel(nextEvent.startTime)} – ${formatTimeLabel(getEffectiveEndTime(nextEvent))}`
              : activeMeeting
                ? `Active now: ${activeMeeting.title}`
                : 'No upcoming events today'}
          </Text>
        </View>

        {!lockScreenReady ? (
          <Text style={[styles.hint, { color: palette.muted }]}>{lockScreenSettingsHint()}</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
    paddingBottom: 120,
  },
  nextBlock: {
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  nextTitle: {
    ...typography.heading,
  },
  nextMeta: {
    ...typography.body,
    fontSize: 14,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
