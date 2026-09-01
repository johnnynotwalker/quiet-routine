import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import PermissionsGate from '@/components/PermissionsGate';
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
  ensureNotificationPermissions,
  ensureStatusNotification,
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
  toggleManualSilence: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

async function evaluateScheduledSilence(data: AppData): Promise<AppData> {
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
      meetingEndIso(activeMeeting)
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

  const toggleManualSilence = useCallback(async () => {
    if (data.silence.isSilenced && data.silence.reason?.type === 'manual') {
      await setSilence(buildSilenceState(false, null));
      return;
    }

    await setSilence(
      buildSilenceState(true, {
        type: 'manual',
        label: 'Manual silence',
      })
    );
  }, [data.silence, setSilence]);

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
      toggleManualSilence,
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
      toggleManualSilence,
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
