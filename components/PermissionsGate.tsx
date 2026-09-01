import { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, View } from 'react-native';

import Button from '@/components/Button';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { describeCalendarAccess, requestCalendarPermissions } from '@/lib/calendar';
import { requestLocationPermissions } from '@/lib/geofencing';
import { isExpoGo } from '@/lib/platform';
import { ensureNotificationPermissions } from '@/lib/silence';

type Props = {
  visible: boolean;
  onComplete: () => void;
};

export default function PermissionsGate({ visible, onComplete }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [step, setStep] = useState(0);
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [calendarGranted, setCalendarGranted] = useState(false);

  const requestLocation = async () => {
    const granted = await requestLocationPermissions();
    setLocationGranted(granted);
    setStep(1);
  };

  const requestNotifications = async () => {
    const granted = await ensureNotificationPermissions();
    setNotificationGranted(granted);
    setStep(2);
  };

  const requestCalendar = async () => {
    const granted = await requestCalendarPermissions();
    setCalendarGranted(granted);
    onComplete();
  };

  const skipCalendar = () => {
    onComplete();
  };

  const steps = [
    {
      title: 'Location access',
      body: isExpoGo()
        ? 'QuietRoutine needs your location while the app is open to show your position on the map and detect silent zones. Background location requires a full app build.'
        : 'QuietRoutine needs your location to detect silent zones — even small 1m areas around your desk or a drawn zone on the map.',
      action: 'Allow location',
      onPress: requestLocation,
      granted: locationGranted,
    },
    {
      title: 'Status notifications',
      body: 'A persistent notification on your lock screen and home screen shows whether your phone is silenced or not, with the QuietRoutine icon.',
      action: 'Allow notifications',
      onPress: requestNotifications,
      granted: notificationGranted,
    },
    {
      title: 'Calendar access (optional)',
      body: describeCalendarAccess(),
      action: 'Connect calendar',
      onPress: requestCalendar,
      granted: calendarGranted,
      skip: 'Use built-in calendar only',
    },
  ];

  const current = steps[step];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: palette.background }]}
        showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.brand}>QuietRoutine</Text>
        <Text style={[styles.tagline, { color: palette.muted }]}>
          Silence your phone in the right places and at the right times — automatically.
        </Text>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={styles.stepLabel}>Step {step + 1} of {steps.length}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={[styles.body, { color: palette.muted }]}>{current.body}</Text>
          {current.granted ? (
            <Text style={[styles.granted, { color: palette.success }]}>Permission granted</Text>
          ) : null}
          <Button title={current.action} onPress={current.onPress} />
          {current.skip ? (
            <Button title={current.skip} variant="secondary" onPress={skipCalendar} />
          ) : null}
        </View>

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
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
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
