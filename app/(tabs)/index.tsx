import { useEffect, useMemo, useState } from 'react';
import { AppState, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { HeaderIconButton } from '@/components/GlowTabIcon';
import Screen from '@/components/Screen';
import StatusHeroCard from '@/components/StatusHeroCard';
import ZoneTile from '@/components/ZoneTile';
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
import { formatTimeLabel, todayIsoDate } from '@/lib/time';

export default function HomeScreen() {
  const { data, toggleManualSilence } = useApp();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [lockScreenReady, setLockScreenReady] = useState(false);

  const refreshPermissionState = async () => {
    const settings = await getStatusNotificationPermissions();
    setLockScreenReady(canShowOnLockScreen(settings) && hasNotificationAccess(settings));
  };

  useEffect(() => {
    refreshPermissionState().catch(console.error);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermissionState().catch(console.error);
    });
    return () => subscription.remove();
  }, []);

  const activeMeeting = getActiveMeeting(data.schedule);
  const today = todayIsoDate();
  const nextEvent = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return data.schedule
      .filter((item) => item.enabled && item.date === today)
      .filter((item) => {
        const [h, m] = item.startTime.split(':').map(Number);
        return h * 60 + m >= currentMinutes;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  }, [data.schedule, today]);

  const activeZoneId =
    data.silence.reason?.type === 'zone' ? data.silence.reason.zoneId : null;
  const zoneTiles = data.zones.slice(0, 2);
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

  const primaryLabel = data.silence.isSilenced ? 'Pause Silence (30m)' : 'Start Silence Mode';

  return (
    <Screen
      variant="greeting"
      greeting="Hello, Alex"
      title=""
      action={<HeaderIconButton name="notifications-outline" onPress={() => Linking.openSettings()} />}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <StatusHeroCard
          silence={data.silence}
          zoneLabel={activeZoneName}
          timeRange={silenceTimeRange}
          primaryLabel={primaryLabel}
          onPrimaryAction={toggleManualSilence}
        />

        <View style={styles.nextBlock}>
          <Text style={[styles.nextTitle, { color: palette.text }]}>
            Next{nextEvent ? `: ${nextEvent.title}` : ''}
          </Text>
          <Text style={[styles.nextMeta, { color: palette.muted }]}>
            {nextEvent
              ? `${nextEvent.startTime} – ${getEffectiveEndTime(nextEvent)}`
              : activeMeeting
                ? `Active now: ${activeMeeting.title}`
                : 'No upcoming events today'}
          </Text>
        </View>

        <View style={styles.zoneRow}>
          {zoneTiles.length === 0 ? (
            <>
              <ZoneTile
                zone={{
                  id: 'placeholder-home',
                  name: 'Home Zone',
                  shape: 'radius',
                  latitude: 0,
                  longitude: 0,
                  radius: 100,
                  enabled: false,
                }}
                active={false}
                onPress={() => router.push('/(tabs)/zones')}
              />
              <ZoneTile
                zone={{
                  id: 'placeholder-office',
                  name: 'Office Zone',
                  shape: 'radius',
                  latitude: 0,
                  longitude: 0,
                  radius: 100,
                  enabled: false,
                }}
                active={false}
                onPress={() => router.push('/(tabs)/zones')}
              />
            </>
          ) : (
            zoneTiles.map((zone) => (
              <ZoneTile
                key={zone.id}
                zone={zone}
                active={zone.id === activeZoneId || (zone.enabled && !activeZoneId)}
                onPress={() => router.push('/(tabs)/zones')}
              />
            ))
          )}
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
  zoneRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
