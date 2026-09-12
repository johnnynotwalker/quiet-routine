import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import PermissionsGate from '@/components/PermissionsGate';
import { openFocusSettings } from '@/lib/focus';
import { checkCurrentLocationZones, syncGeofencing } from '@/lib/geofencing';
import { setupReminderChannel, syncEventReminders } from '@/lib/reminders';
import {
  getActiveMeeting,
  meetingEndIso,
  meetingSilenceReason,
} from '@/lib/schedule';
import {
  applySilenceState,
  buildSilenceState,
  clearSilencePause,
  ensureNotificationPermissions,
  ensureStatusNotification,
  isSilencePaused,
  pauseSilenceFor,
  setupNotificationChannel,
} from '@/lib/silence';
import {
  loadAppData,
  saveAppData,
  updateRoutines,
  updateSchedule,
  updateSettings,
  updateSilence,
  updateZones,
} from '@/lib/storage';
import {
  AppData,
  AppSettings,
  DEFAULT_APP_DATA,
  RoutineItem,
  ScheduledSilence,
  SilenceState,
  SilentZone,
} from '@/lib/types';

type AppContextValue = {
  data: AppData;
  loading: boolean;
  refresh: () => Promise<void>;
  setZones: (zones: SilentZone[]) => Promise<void>;
  setRoutines: (routines: RoutineItem[]) => Promise<void>;
  setSchedule: (schedule: ScheduledSilence[]) => Promise<void>;
  setSilence: (silence: SilenceState) => Promise<void>;
  acknowledgePermissions: () => Promise<void>;
  setFocusBridgeLinked: (linked: boolean) => Promise<void>;
  toggleManualSilence: () => Promise<void>;
  /** Arm/disarm a zone mute (works even when you are not inside it). */
  toggleZoneMute: (zoneId: string) => Promise<void>;
  deleteZone: (zoneId: string) => Promise<void>;
  moveZone: (zoneId: string, center: { latitude: number; longitude: number }) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

async function clearExpiredPauseIfNeeded(data: AppData): Promise<AppData> {
  if (!data.silence.pausedUntil) return data;
  if (isSilencePaused(data.silence)) return data;

  const nextSilence = clearSilencePause(data.silence);
  const next = { ...data, silence: nextSilence };
  await saveAppData(next);
  return next;
}

async function evaluateScheduledSilence(data: AppData): Promise<AppData> {
  data = await clearExpiredPauseIfNeeded(data);

  // While paused, do not apply schedule mute — home countdown owns this window.
  if (isSilencePaused(data.silence)) {
    return data;
  }

  const activeMeeting = getActiveMeeting(data.schedule);
  const zoneSilenced = data.silence.reason?.type === 'zone' && data.silence.isSilenced;
  const manualSilenced = data.silence.reason?.type === 'manual' && data.silence.isSilenced;

  if (zoneSilenced || manualSilenced) {
    return data;
  }

  if (activeMeeting) {
    const nextSilence = buildSilenceState(
      true,
      meetingSilenceReason(activeMeeting),
      meetingEndIso(activeMeeting),
      null
    );

    if (
      data.silence.isSilenced &&
      data.silence.reason?.type === 'meeting' &&
      data.silence.reason.meetingId === activeMeeting.id
    ) {
      return data;
    }

    const next = { ...data, silence: nextSilence };
    await saveAppData(next);
    await applySilenceState(nextSilence);
    return next;
  }

  if (data.silence.isSilenced && data.silence.reason?.type === 'meeting') {
    const nextSilence = buildSilenceState(false, null);
    const next = { ...data, silence: nextSilence };
    await saveAppData(next);
    await applySilenceState(nextSilence);
    return next;
  }

  return data;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_APP_DATA);
  const [loading, setLoading] = useState(true);
  const silenceRef = useRef(data.silence);

  silenceRef.current = data.silence;

  const refresh = useCallback(async () => {
    const loaded = await loadAppData();
    const evaluated = await evaluateScheduledSilence(loaded);
    setData(evaluated);
    await syncGeofencing(evaluated.zones);
    await checkCurrentLocationZones();
    await syncEventReminders(evaluated.schedule);
    await ensureStatusNotification(evaluated.silence);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      await ensureNotificationPermissions();
      await setupNotificationChannel();
      await setupReminderChannel();

      const loaded = await loadAppData();
      const evaluated = await evaluateScheduledSilence(loaded);
      if (!mounted) return;

      setData(evaluated);
      await syncGeofencing(evaluated.zones);
      await syncEventReminders(evaluated.schedule);
      await applySilenceState(evaluated.silence);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh().catch(console.error);
    }, 15_000);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' || state === 'background') {
        refresh().catch(console.error);
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refresh]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const interval = setInterval(() => {
      ensureStatusNotification(silenceRef.current).catch(console.error);
    }, 3_000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        type?: string;
        action?: string;
      };
      if (data?.action === 'open-focus' || data?.type === 'alarm') {
        openFocusSettings().catch(console.error);
      }
    });
    return () => subscription.remove();
  }, []);

  const setZones = useCallback(async (zones: SilentZone[]) => {
    const next = await updateZones(zones);
    setData(next);
    await syncGeofencing(zones);
  }, []);

  const setRoutines = useCallback(async (routines: RoutineItem[]) => {
    const next = await updateRoutines(routines);
    setData(next);
  }, []);

  const setSchedule = useCallback(async (schedule: ScheduledSilence[]) => {
    const next = await updateSchedule(schedule);
    const evaluated = await evaluateScheduledSilence(next);
    setData(evaluated);
    await syncEventReminders(evaluated.schedule);
  }, []);

  const setSilence = useCallback(async (silence: SilenceState) => {
    const next = await updateSilence(silence);
    setData(next);
    await applySilenceState(silence);
  }, []);

  const acknowledgePermissions = useCallback(async () => {
    const settings: AppSettings = {
      ...data.settings,
      permissionsAcknowledged: true,
    };
    const next = await updateSettings(settings);
    setData(next);
  }, [data.settings]);

  const setFocusBridgeLinked = useCallback(async (linked: boolean) => {
    const settings: AppSettings = {
      ...data.settings,
      focusBridgeLinked: linked,
    };
    const next = await updateSettings(settings);
    setData(next);
    if (linked && next.silence.isSilenced) {
      const { applySystemSilence, resetSystemSilenceCache } = await import('@/lib/system-silence');
      resetSystemSilenceCache();
      await applySystemSilence(true, { force: true });
    }
  }, [data.settings, data.silence.isSilenced]);

  const pauseSilence = useCallback(async () => {
    const nextSilence = pauseSilenceFor(30);
    await setSilence(nextSilence);
  }, [setSilence]);

  const resumeFromPause = useCallback(async () => {
    const cleared = clearSilencePause(data.silence);
    const next = await updateSilence(cleared);
    const evaluated = await evaluateScheduledSilence(next);
    setData(evaluated);
    await checkCurrentLocationZones();
    await applySilenceState(evaluated.silence);
  }, [data.silence]);

  const toggleManualSilence = useCallback(async () => {
    // If currently silenced (zone / meeting / manual), pause for 30 minutes and turn DND off.
    if (data.silence.isSilenced) {
      await pauseSilence();
      return;
    }

    // If already in a pause countdown, resume early and re-apply zone/schedule.
    if (isSilencePaused(data.silence)) {
      await resumeFromPause();
      return;
    }

    await setSilence(
      buildSilenceState(true, {
        type: 'manual',
        label: 'Manual silence',
      })
    );
  }, [data.silence, pauseSilence, resumeFromPause, setSilence]);

  const toggleZoneMute = useCallback(
    async (zoneId: string) => {
      const zone = data.zones.find((item) => item.id === zoneId);
      if (!zone) return;

      const nextEnabled = !zone.enabled;
      const nextZones = data.zones.map((item) =>
        item.id === zoneId ? { ...item, enabled: nextEnabled } : item
      );
      await setZones(nextZones);

      if (!nextEnabled) {
        if (data.silence.reason?.type === 'zone' && data.silence.reason.zoneId === zoneId) {
          await setSilence(buildSilenceState(false, null));
        }
        return;
      }

      // Mute from anywhere — apply this zone's silence even if you are not inside it.
      await setSilence(
        buildSilenceState(true, {
          type: 'zone',
          zoneName: zone.name,
          zoneId: zone.id,
        })
      );
    },
    [data.silence.reason, data.zones, setSilence, setZones]
  );

  const deleteZone = useCallback(
    async (zoneId: string) => {
      const nextZones = data.zones.filter((zone) => zone.id !== zoneId);
      await setZones(nextZones);
      if (data.silence.reason?.type === 'zone' && data.silence.reason.zoneId === zoneId) {
        await setSilence(buildSilenceState(false, null));
      }
    },
    [data.silence.reason, data.zones, setSilence, setZones]
  );

  const moveZone = useCallback(
    async (zoneId: string, center: { latitude: number; longitude: number }) => {
      const nextZones = data.zones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              latitude: center.latitude,
              longitude: center.longitude,
            }
          : zone
      );
      await setZones(nextZones);
    },
    [data.zones, setZones]
  );

  const value = useMemo(
    () => ({
      data,
      loading,
      refresh,
      setZones,
      setRoutines,
      setSchedule,
      setSilence,
      acknowledgePermissions,
      setFocusBridgeLinked,
      toggleManualSilence,
      pauseSilence,
      resumeFromPause,
      toggleZoneMute,
      deleteZone,
      moveZone,
    }),
    [
      data,
      loading,
      refresh,
      setZones,
      setRoutines,
      setSchedule,
      setSilence,
      acknowledgePermissions,
      setFocusBridgeLinked,
      toggleManualSilence,
      pauseSilence,
      resumeFromPause,
      toggleZoneMute,
      deleteZone,
      moveZone,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {!loading && !data.settings.permissionsAcknowledged ? (
        <PermissionsGate visible onComplete={acknowledgePermissions} />
      ) : null}
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
