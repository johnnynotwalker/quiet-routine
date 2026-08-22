import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { syncGeofencing } from '@/lib/geofencing';
import {
  getActiveMeeting,
  meetingEndIso,
  meetingSilenceReason,
} from '@/lib/schedule';
import {
  applySilenceState,
  buildSilenceState,
  ensureNotificationPermissions,
  setupNotificationChannel,
} from '@/lib/silence';
import {
  loadAppData,
  saveAppData,
  updateRoutines,
  updateSchedule,
  updateSilence,
  updateZones,
} from '@/lib/storage';
import {
  AppData,
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

  const refresh = useCallback(async () => {
    const loaded = await loadAppData();
    const evaluated = await evaluateScheduledSilence(loaded);
    setData(evaluated);
    await syncGeofencing(evaluated.zones);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      await ensureNotificationPermissions();
      await setupNotificationChannel();
      const loaded = await loadAppData();
      const evaluated = await evaluateScheduledSilence(loaded);
      if (!mounted) return;
      setData(evaluated);
      await syncGeofencing(evaluated.zones);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh().catch(console.error);
    }, 30_000);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh().catch(console.error);
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refresh]);

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
  }, []);

  const setSilence = useCallback(async (silence: SilenceState) => {
    const next = await updateSilence(silence);
    setData(next);
    await applySilenceState(silence);
  }, []);

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
      toggleManualSilence,
    }),
    [data, loading, refresh, setZones, setRoutines, setSchedule, setSilence, toggleManualSilence]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
