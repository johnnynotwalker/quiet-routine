import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import Button from '@/components/Button';
import GlassCard from '@/components/GlassCard';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { openFocusSettings } from '@/lib/focus';
import { lockScreenSettingsHint } from '@/lib/notification-permissions';
import { requestAutomaticShortcutsSetup } from '@/lib/shortcuts-setup';
import {
  SILENCE_OFF_SHORTCUT,
  SILENCE_ON_SHORTCUT,
  applySystemSilence,
  openShortcutsApp,
} from '@/lib/system-silence';

/**
 * Real Do Not Disturb bridge.
 * Focus schedules work because Focus is iOS itself — apps cannot set Focus with a public API.
 * QuietRoutine still drives DND for your zones/calendar by running Shortcuts you link once.
 */
export default function SilenceLimitationsCard() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const { data, setFocusBridgeLinked } = useApp();
  const [busy, setBusy] = useState(false);
  const linked = data.settings.focusBridgeLinked === true;

  const linkBridge = async () => {
    setBusy(true);
    try {
      if (Platform.OS === 'ios') {
        await requestAutomaticShortcutsSetup();
      }
      await setFocusBridgeLinked(true);
      if (data.silence.isSilenced) {
        await applySystemSilence(true, { force: true });
      }
      Alert.alert(
        'Focus linked',
        `QuietRoutine will run “${SILENCE_ON_SHORTCUT}” and “${SILENCE_OFF_SHORTCUT}” for zones and schedule — including muted incoming calls when Do Not Disturb allows calls from Nobody.`
      );
    } finally {
      setBusy(false);
    }
  };

  if (Platform.OS === 'ios') {
    return (
      <GlassCard contentStyle={styles.card}>
        <Text style={[styles.title, { color: palette.text }]}>
          {linked ? 'Do Not Disturb linked' : 'Make silence real with Focus'}
        </Text>
        <Text style={[styles.body, { color: palette.muted }]}>
          Focus can mute notifications and incoming calls because it is built into iOS. Apps cannot
          flip Focus themselves — QuietRoutine runs your Focus Shortcuts when a zone or schedule
          says silence.
        </Text>
        {!linked ? (
          <View style={styles.steps}>
            <Text style={[styles.step, { color: palette.text }]}>
              1. Tap below — QuietRoutine creates “{SILENCE_ON_SHORTCUT}” and “{SILENCE_OFF_SHORTCUT}”.
            </Text>
            <Text style={[styles.step, { color: palette.text }]}>
              2. On each sheet: Set Focus → Do Not Disturb (On / Off) and save.
            </Text>
            <Text style={[styles.step, { color: palette.text }]}>
              3. In Focus → Do Not Disturb → People, set Allow Calls From to Nobody so incoming
              calls stay muted too.
            </Text>
          </View>
        ) : (
          <Text style={[styles.body, { color: palette.muted }]}>
            Linked. Zones and schedule turn Focus on (muting notifications and calls) and off when
            you leave.
          </Text>
        )}
        <View style={styles.actions}>
          {!linked ? (
            <>
              <Button title="Open Shortcuts" variant="secondary" onPress={() => { openShortcutsApp().catch(console.error); }} />
              <Button title={busy ? 'Linking…' : 'Create shortcuts & link Focus'} onPress={linkBridge} />
            </>
          ) : (
            <>
              <Button
                title="Test mute (DND + calls)"
                variant="secondary"
                onPress={() => {
                  applySystemSilence(true, { force: true }).catch(console.error);
                }}
              />
              <Button
                title="Mute incoming calls setup"
                variant="secondary"
                onPress={() => {
                  import('@/lib/shortcuts-setup')
                    .then(({ ensureIncomingCallsMuted }) => ensureIncomingCallsMuted())
                    .catch(console.error);
                }}
              />
              <Pressable onPress={() => setFocusBridgeLinked(false)}>
                <Text style={[styles.link, { color: palette.tint }]}>Unlink Focus</Text>
              </Pressable>
            </>
          )}
          <Pressable onPress={() => openFocusSettings().catch(console.error)}>
            <Text style={[styles.link, { color: palette.tint }]}>Open Focus settings</Text>
          </Pressable>
        </View>
        <Text style={[styles.hint, { color: palette.muted }]}>
          Lock screen status still only needs notifications. {lockScreenSettingsHint()}
        </Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard contentStyle={styles.card}>
      <Text style={[styles.title, { color: palette.text }]}>Do Not Disturb on Android</Text>
      <Text style={[styles.body, { color: palette.muted }]}>
        QuietRoutine tracks zones and your schedule. Link the DND bridge and grant Do Not Disturb
        access so silence can apply for real on a production build.
      </Text>
      <Button
        title={linked ? 'Open phone settings' : 'Enable DND bridge'}
        onPress={async () => {
          if (!linked) await setFocusBridgeLinked(true);
          await applySystemSilence(true, { force: true });
        }}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  title: { ...typography.heading },
  body: { ...typography.body },
  steps: { gap: 8 },
  step: { ...typography.body, fontSize: 14 },
  actions: { gap: 10, marginTop: 4 },
  link: { fontSize: 14, fontWeight: '600' },
  hint: { ...typography.body, fontSize: 12, marginTop: 4 },
});
