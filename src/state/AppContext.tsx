import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState as NativeAppState } from 'react-native';

import { defaultSettings, type CycleEstimate, type DailyLog, type PeriodEvent, type UserSettings } from '@/domain/types';
import { cycleRepository } from '@/services/CycleRepository';
import { exportService } from '@/services/ExportService';
import { predictionService } from '@/services/PredictionService';
import { reminderScheduler } from '@/services/ReminderScheduler';

type AppState = {
  ready: boolean;
  error: Error | null;
  settings: UserSettings;
  events: PeriodEvent[];
  logs: DailyLog[];
  estimate: CycleEstimate | null;
  refresh: () => Promise<{ settings: UserSettings; estimate: CycleEstimate | null }>;
  saveLog: (log: DailyLog) => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  replaceSettings: (settings: UserSettings) => Promise<void>;
  deleteAllData: () => Promise<void>;
  retryInitialization: () => Promise<void>;
  resetEncryptedStorage: () => Promise<void>;
};

const Context = createContext<AppState | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Providers below AppProvider render before encrypted storage finishes loading.
  // A real default keeps that first production render safe and is replaced by
  // the persisted settings as soon as initialization completes.
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [events, setEvents] = useState<PeriodEvent[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [estimate, setEstimate] = useState<CycleEstimate | null>(null);
  const timezone = useRef(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const load = useCallback(async () => {
    const [nextSettings, nextEvents, nextLogs] = await Promise.all([cycleRepository.getSettings(), cycleRepository.listPeriodEvents(), cycleRepository.listDailyLogs()]);
    setSettings(nextSettings); setEvents(nextEvents); setLogs(nextLogs);
    const nextEstimate = predictionService.estimate(nextEvents, nextSettings.baselineCycleLength, nextSettings.baselinePeriodLength, nextSettings.locale);
    setEstimate(nextEstimate);
    return { settings: nextSettings, estimate: nextEstimate };
  }, []);

  const retryInitialization = useCallback(async () => {
    setReady(false);
    setError(null);
    try {
      try { exportService.cleanupTemporaryExports(); } catch { /* Cache cleanup must not block startup. */ }
      await cycleRepository.initialize();
      await load();
      setReady(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    }
  }, [load]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        try { exportService.cleanupTemporaryExports(); } catch { /* Cache cleanup must not block startup. */ }
        await cycleRepository.initialize();
        await load();
        if (active) setReady(true);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught : new Error(String(caught)));
      }
    })();
    return () => { active = false; };
  }, [load]);

  useEffect(() => NativeAppState.addEventListener('change', (state) => {
    if (state !== 'active' || !ready) return;
    const current = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (current !== timezone.current) {
      timezone.current = current;
      void reminderScheduler.reschedule(settings, estimate).catch(() => undefined);
    }
  }).remove, [estimate, ready, settings]);

  const saveLog = useCallback(async (log: DailyLog) => {
    await cycleRepository.saveDailyLog(log);
    const next = await load();
    try { await reminderScheduler.reschedule(next.settings, next.estimate); } catch { /* The saved log remains valid. */ }
  }, [load]);
  const replaceSettings = useCallback(async (next: UserSettings) => {
    await cycleRepository.saveSettings(next);
    setSettings(next);
    const nextEstimate = predictionService.estimate(events, next.baselineCycleLength, next.baselinePeriodLength, next.locale);
    setEstimate(nextEstimate);
    try { await reminderScheduler.reschedule(next, nextEstimate); } catch { /* Settings must remain usable without notifications. */ }
  }, [events]);
  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => replaceSettings({ ...settings, ...patch }), [replaceSettings, settings]);
  const deleteAllData = useCallback(async () => {
    await cycleRepository.deleteAllData();
    await load();
    try { await reminderScheduler.cancelAll(); } catch { /* Database deletion must not be rolled back by notification errors. */ }
    try { exportService.cleanupTemporaryExports(); } catch { /* Cache cleanup is best effort. */ }
  }, [load]);
  const resetEncryptedStorage = useCallback(async () => {
    setReady(false);
    setError(null);
    try {
      try { await reminderScheduler.cancelAll(); } catch { /* Continue with the confirmed local reset. */ }
      try { exportService.cleanupTemporaryExports(); } catch { /* Continue with the confirmed local reset. */ }
      await cycleRepository.resetEncryptedStorage();
      await cycleRepository.initialize();
      await load();
      setReady(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    }
  }, [load]);

  const value = useMemo(() => ({ ready, error, settings, events, logs, estimate, refresh: load, saveLog, updateSettings, replaceSettings, deleteAllData, retryInitialization, resetEncryptedStorage }), [ready, error, settings, events, logs, estimate, load, saveLog, updateSettings, replaceSettings, deleteAllData, retryInitialization, resetEncryptedStorage]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
