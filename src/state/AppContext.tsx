import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState as NativeAppState } from 'react-native';

import type { CycleEstimate, DailyLog, PeriodEvent, UserSettings } from '@/domain/types';
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
};

const Context = createContext<AppState | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [settings, setSettings] = useState<UserSettings>(null as unknown as UserSettings);
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

  useEffect(() => {
    (async () => {
      try { exportService.cleanupTemporaryExports(); await cycleRepository.initialize(); await load(); setReady(true); }
      catch (caught) { setError(caught instanceof Error ? caught : new Error(String(caught))); }
    })();
  }, [load]);

  useEffect(() => NativeAppState.addEventListener('change', (state) => {
    if (state !== 'active' || !ready) return;
    const current = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (current !== timezone.current) { timezone.current = current; void reminderScheduler.reschedule(settings, estimate); }
  }).remove, [estimate, ready, settings]);

  const saveLog = useCallback(async (log: DailyLog) => { await cycleRepository.saveDailyLog(log); const next = await load(); await reminderScheduler.reschedule(next.settings, next.estimate); }, [load]);
  const replaceSettings = useCallback(async (next: UserSettings) => { await cycleRepository.saveSettings(next); setSettings(next); const nextEstimate = predictionService.estimate(events, next.baselineCycleLength, next.baselinePeriodLength, next.locale); setEstimate(nextEstimate); await reminderScheduler.reschedule(next, nextEstimate); }, [events]);
  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => replaceSettings({ ...settings, ...patch }), [replaceSettings, settings]);
  const deleteAllData = useCallback(async () => { await reminderScheduler.reschedule({ ...settings, reminders: { ...settings.reminders, enabled: false } }, null); exportService.cleanupTemporaryExports(); await cycleRepository.deleteAllData(); await load(); }, [load, settings]);

  const value = useMemo(() => ({ ready, error, settings, events, logs, estimate, refresh: load, saveLog, updateSettings, replaceSettings, deleteAllData }), [ready, error, settings, events, logs, estimate, load, saveLog, updateSettings, replaceSettings, deleteAllData]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
