import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

import { defaultSettings, type DailyLog, type PeriodEvent, type UserSettings } from '@/domain/types';
import { assertDatabaseKeyState, assertSupportedDatabaseVersion, groupPeriodDates } from '@/services/repositoryPolicy';

const DATABASE_NAME = 'your-cycle.db';
const DATABASE_KEY_NAME = 'your-cycle.database-key.v1';
const DATABASE_VERSION = 1;

type PeriodRow = { id: number; start_date: string; end_date: string };
type LogRow = { date: string; flow: number; pain: number; mood: number; energy: number; spotting: number; discharge: string | null; sexual_activity: number | null; notes: string; symptoms_json: string };

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export class DatabaseKeyUnavailableError extends Error {
  constructor() { super('The encrypted database key is unavailable. Restore is intentionally unsupported; the user must explicitly delete local data to recover.'); }
}

export class CycleRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    if (this.db) return;
    let key = await SecureStore.getItemAsync(DATABASE_KEY_NAME, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    if (!key) {
      const databaseExists = await this.databaseExists();
      try { assertDatabaseKeyState(key, databaseExists); } catch { throw new DatabaseKeyUnavailableError(); }
      key = bytesToHex(Crypto.getRandomBytes(32));
      await SecureStore.setItemAsync(DATABASE_KEY_NAME, key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    }

    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync(`PRAGMA key = "x'${key}'"`);
    await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA secure_delete = ON;');
    await this.migrate(db);
    this.db = db;
  }

  private async databaseExists() {
    // expo-sqlite exposes an absolute native path on Android (for example
    // /data/user/0/.../files/SQLite), while expo-file-system's modern File
    // API requires a file:// URI. Paths.document is already a valid Directory
    // object and SQLite's default database folder is its "SQLite" child on
    // both Android and iOS.
    return new File(Paths.document, 'SQLite', DATABASE_NAME).exists;
  }

  private requireDb() {
    if (!this.db) throw new Error('CycleRepository.initialize() must complete first');
    return this.db;
  }

  private async migrate(db: SQLite.SQLiteDatabase) {
    const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    let version = result?.user_version ?? 0;
    assertSupportedDatabaseVersion(version, DATABASE_VERSION);
    if (version === 0) {
      await db.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.execAsync(`
          CREATE TABLE period_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            CHECK(start_date <= end_date)
          );
          CREATE UNIQUE INDEX period_events_start_idx ON period_events(start_date);
          CREATE TABLE daily_logs (
            date TEXT PRIMARY KEY NOT NULL,
            flow INTEGER NOT NULL DEFAULT 0,
            pain INTEGER NOT NULL DEFAULT 0,
            mood INTEGER NOT NULL DEFAULT 2,
            energy INTEGER NOT NULL DEFAULT 2,
            spotting INTEGER NOT NULL DEFAULT 0,
            discharge TEXT,
            sexual_activity INTEGER,
            notes TEXT NOT NULL DEFAULT '',
            symptoms_json TEXT NOT NULL DEFAULT '[]'
          );
          CREATE TABLE app_settings (id INTEGER PRIMARY KEY CHECK(id = 1), json TEXT NOT NULL);
        `);
        await transaction.runAsync('INSERT INTO app_settings (id, json) VALUES (1, ?)', JSON.stringify(defaultSettings));
      });
      version = 1;
    }
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }

  async listPeriodEvents(): Promise<PeriodEvent[]> {
    const rows = await this.requireDb().getAllAsync<PeriodRow>('SELECT id, start_date, end_date FROM period_events ORDER BY start_date');
    return rows.map((row) => ({ id: row.id, startDate: row.start_date, endDate: row.end_date }));
  }

  async getDailyLog(date: string): Promise<DailyLog | null> {
    const row = await this.requireDb().getFirstAsync<LogRow>('SELECT * FROM daily_logs WHERE date = ?', date);
    if (!row) return null;
    return { date: row.date, flow: row.flow as DailyLog['flow'], pain: row.pain as DailyLog['pain'], mood: row.mood as DailyLog['mood'], energy: row.energy as DailyLog['energy'], spotting: Boolean(row.spotting), discharge: row.discharge, sexualActivity: row.sexual_activity === null ? null : Boolean(row.sexual_activity), notes: row.notes, symptoms: JSON.parse(row.symptoms_json) };
  }

  async listDailyLogs(): Promise<DailyLog[]> {
    const rows = await this.requireDb().getAllAsync<LogRow>('SELECT * FROM daily_logs ORDER BY date');
    return rows.map((row) => ({ date: row.date, flow: row.flow as DailyLog['flow'], pain: row.pain as DailyLog['pain'], mood: row.mood as DailyLog['mood'], energy: row.energy as DailyLog['energy'], spotting: Boolean(row.spotting), discharge: row.discharge, sexualActivity: row.sexual_activity === null ? null : Boolean(row.sexual_activity), notes: row.notes, symptoms: JSON.parse(row.symptoms_json) }));
  }

  async saveDailyLog(log: DailyLog) {
    const db = this.requireDb();
    await db.runAsync(`INSERT INTO daily_logs (date, flow, pain, mood, energy, spotting, discharge, sexual_activity, notes, symptoms_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET flow=excluded.flow, pain=excluded.pain, mood=excluded.mood, energy=excluded.energy, spotting=excluded.spotting, discharge=excluded.discharge, sexual_activity=excluded.sexual_activity, notes=excluded.notes, symptoms_json=excluded.symptoms_json`,
      [log.date, log.flow, log.pain, log.mood, log.energy, Number(log.spotting), log.discharge, log.sexualActivity === null ? null : Number(log.sexualActivity), log.notes, JSON.stringify(log.symptoms)]);
    await this.rebuildPeriodEvents();
  }

  private async rebuildPeriodEvents() {
    const db = this.requireDb();
    const rows = await db.getAllAsync<{ date: string }>('SELECT date FROM daily_logs WHERE flow > 0 AND spotting = 0 ORDER BY date');
    const groups = groupPeriodDates(rows.map((row) => row.date));
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync('DELETE FROM period_events;');
      for (const group of groups) await transaction.runAsync('INSERT INTO period_events (start_date, end_date) VALUES (?, ?)', group.start, group.end);
    });
  }

  async getSettings(): Promise<UserSettings> {
    const row = await this.requireDb().getFirstAsync<{ json: string }>('SELECT json FROM app_settings WHERE id = 1');
    return { ...defaultSettings, ...(row ? JSON.parse(row.json) : {}) };
  }

  async saveSettings(settings: UserSettings) {
    await this.requireDb().runAsync('UPDATE app_settings SET json = ? WHERE id = 1', JSON.stringify(settings));
  }

  async deleteAllData() {
    const db = this.requireDb();
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync('DELETE FROM daily_logs; DELETE FROM period_events;');
      await transaction.runAsync('UPDATE app_settings SET json = ? WHERE id = 1', JSON.stringify(defaultSettings));
    });
  }
}

export const cycleRepository = new CycleRepository();
