import { useEffect, useState } from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Button from '@/components/Button';
import GlassCard from '@/components/GlassCard';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { describeCalendarAccess, requestCalendarPermissions } from '@/lib/calendar';
import { requestLocationPermissions } from '@/lib/geofencing';
import { isExpoGo } from '@/lib/platform';
import { requestAutomaticShortcutsSetup } from '@/lib/shortcuts-setup';
import { SILENCE_OFF_SHORTCUT, SILENCE_ON_SHORTCUT } from '@/lib/system-silence';
import { spacing, typography } from '@/constants/theme';
import {
  canShowOnLockScreen,
  getStatusNotificationPermissions,
  hasNotificationAccess,
  requestStatusNotificationPermissions,
} from '@/lib/notification-permissions';
import { buildSilenceState, ensureStatusNotification } from '@/lib/silence';

type Props = {
  visible: boolean;
  onComplete: (options?: { focusBridgeLinked?: boolean }) => void;
};

export default function PermissionsGate({ visible, onComplete }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [step, setStep] = useState(0);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [lockScreenReady, setLockScreenReady] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [calendarGranted, setCalendarGranted] = useState(false);

  const refreshNotificationState = async () => {
    const settings = await getStatusNotificationPermissions();
    setNotificationGranted(hasNotificationAccess(settings));
    setLockScreenReady(canShowOnLockScreen(settings));
  };

  useEffect(() => {
    if (visible) {
      refreshNotificationState().catch(console.error);
    }
  }, [visible]);

  const requestNotifications = async () => {
    await requestStatusNotificationPermissions();
    await refreshNotificationState();
    await ensureStatusNotification(buildSilenceState(false, null));
    setStep(1);
  };

  const requestLocation = async () => {
    const granted = await requestLocationPermissions();
    setLocationGranted(granted);
    setStep(2);
  };

  const skipLocation = () => {
    setStep(2);
  };

  const requestCalendar = async () => {
    const granted = await requestCalendarPermissions();
    setCalendarGranted(granted);
    setStep(3);
  };

  const skipCalendar = () => {
    setStep(3);
  };

  const finishWithShortcuts = async (linkBridge: boolean) => {
    if (linkBridge && Platform.OS === 'ios') {
      await requestAutomaticShortcutsSetup();
      onComplete({ focusBridgeLinked: true });
      return;
    }
    if (linkBridge && Platform.OS === 'android') {
      onComplete({ focusBridgeLinked: true });
      return;
    }
    onComplete({ focusBridgeLinked: false });
  };

  const steps = [
    {
      title: 'Lock screen status',
      body: isExpoGo()
        ? 'Allow notifications so QuietRoutine can show "Phone is silenced" or "Phone is not silenced" on your lock screen. This only needs notification permission — not location. In Expo Go, also enable Lock Screen under Settings → Notifications → Expo Go.'
        : 'Allow notifications so QuietRoutine can show your silence status on the lock screen and in the notification shade. Location is not required for this.',
      action: 'Allow notifications',
      onPress: requestNotifications,
      granted: lockScreenReady,
      grantedLabel: lockScreenReady ? 'Lock screen status ready' : notificationGranted ? 'Notifications on — enable Lock Screen in Settings' : undefined,
      skip: notificationGranted ? 'Continue' : undefined,
      onSkip: notificationGranted ? () => setStep(1) : undefined,
    },
    {
      title: 'Location access (optional)',
      body: isExpoGo()
        ? 'Needed only for map zones while the app is open. You can skip this and still use calendar events and lock screen status.'
        : 'Needed for silent zones on the map. You can skip and still use calendar + lock screen status.',
      action: 'Allow location',
      onPress: requestLocation,
      granted: locationGranted,
      skip: 'Skip location',
      onSkip: skipLocation,
    },
    {
      title: 'Calendar access (optional)',
      body: describeCalendarAccess(),
      action: 'Connect calendar',
      onPress: requestCalendar,
      granted: calendarGranted,
      skip: 'Use built-in calendar only',
      onSkip: skipCalendar,
    },
    {
      title: 'Do Not Disturb shortcuts',
      body:
        Platform.OS === 'ios'
          ? `Allow QuietRoutine to add “${SILENCE_ON_SHORTCUT}” and “${SILENCE_OFF_SHORTCUT}” so zones and your schedule can turn Do Not Disturb on and off automatically.`
          : 'Allow QuietRoutine to use Do Not Disturb when a zone or schedule says you should be silent.',
      action: Platform.OS === 'ios' ? 'Add shortcuts' : 'Enable Do Not Disturb bridge',
      onPress: () => finishWithShortcuts(true),
      granted: false,
      skip: 'Skip for now',
      onSkip: () => finishWithShortcuts(false),
    },
  ];

  const current = steps[step];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <LinearGradient
        colors={[palette.background, palette.backgroundAlt, palette.background]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: 'transparent' }]}
        showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={[styles.brand, { color: palette.text }]}>QuietRoutine</Text>
        <Text style={[styles.tagline, { color: palette.muted }]}>
          Calm, glass-clear silence on your lock screen.
        </Text>

        <GlassCard contentStyle={styles.card}>
          <Text style={[styles.stepLabel, { color: palette.tint }]}>Step {step + 1} of {steps.length}</Text>
          <Text style={[styles.title, { color: palette.text }]}>{current.title}</Text>
          <Text style={[styles.body, { color: palette.muted }]}>{current.body}</Text>
          {current.grantedLabel ? (
            <Text style={[styles.granted, { color: palette.success }]}>{current.grantedLabel}</Text>
          ) : current.granted ? (
            <Text style={[styles.granted, { color: palette.success }]}>Permission granted</Text>
          ) : null}
          <Button title={current.action} onPress={current.onPress} />
          {current.skip && current.onSkip ? (
            <Button title={current.skip} variant="secondary" onPress={current.onSkip} />
          ) : null}
        </GlassCard>

        <View style={styles.progressRow}>
          {steps.map((item, index) => (
            <View
              key={item.title}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    index <= step || item.granted ? palette.tint : palette.border,
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignSelf: 'center',
  },
  brand: {
    ...typography.hero,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    gap: spacing.md,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...typography.title,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  granted: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
});
