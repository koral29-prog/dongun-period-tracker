export type Locale = 'en' | 'tr';
export type ThemePreference = 'system' | 'light' | 'dark';
export type LocalDate = string;

export type FlowLevel = 0 | 1 | 2 | 3 | 4;
export type ScaleLevel = 0 | 1 | 2 | 3 | 4;

export interface PeriodEvent {
  id: number;
  startDate: LocalDate;
  endDate: LocalDate;
}

export interface DailyLog {
  date: LocalDate;
  flow: FlowLevel;
  pain: ScaleLevel;
  mood: ScaleLevel;
  energy: ScaleLevel;
  spotting: boolean;
  discharge: string | null;
  sexualActivity: boolean | null;
  notes: string;
  symptoms: string[];
}

export interface CycleEstimate {
  centerDate: LocalDate;
  estimatedStartMin: LocalDate;
  estimatedStartMax: LocalDate;
  expectedPeriodLength: number;
  supportingCycles: number;
  variabilityDays: number;
  disclaimer: string;
}

export interface ReminderSchedule {
  enabled: boolean;
  hour: number;
  minute: number;
  periodEstimateDaysBefore: number;
}

export interface UserSettings {
  locale: Locale;
  theme: ThemePreference;
  enabledTrackers: string[];
  reminders: ReminderSchedule;
  notificationPrivacy: 'discreet' | 'descriptive';
  lockEnabled: boolean;
  lockGraceSeconds: number;
  baselineCycleLength: number;
  baselinePeriodLength: number;
  onboardingComplete: boolean;
}

export const defaultSettings: UserSettings = {
  locale: 'en',
  theme: 'system',
  enabledTrackers: ['flow', 'pain', 'mood', 'energy', 'symptoms', 'notes'],
  reminders: { enabled: false, hour: 20, minute: 0, periodEstimateDaysBefore: 2 },
  notificationPrivacy: 'discreet',
  lockEnabled: false,
  lockGraceSeconds: 30,
  baselineCycleLength: 28,
  baselinePeriodLength: 5,
  onboardingComplete: false,
};
