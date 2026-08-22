import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

import { isValidLocalDate } from '@/domain/localDate';
import { defaultSettings, type DailyLog, type PeriodEvent, type UserSettings } from '@/domain/types';
import {
  assertDatabaseKeyState,
  assertSupportedDatabaseVersion,
  assertValidDatabaseKey,
  groupPeriodDates,
  parseSettingsJson,
  parseSymptomsJson,
} from '@/services/repositoryPolicy';

const DATABASE_NAME = 'your-cycle.db';
const DATABASE_KEY_NAME = 'your-cycle.database-key.v1';
const DATABASE_VERSION = 1;

type PeriodRow = { id: number; start_date: string; end_date: string };
type LogRow = { date: string; flow: number; pain: number; mood: number; energy: number; spotting: number; discharge: string | null; sexual_activity: number | null; notes: string; symptoms_json: string };

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function scaleLevel(value: number, fallback: DailyLog['flow']): DailyLog['flow'] {
  return Number.isInteger(value) && value >= 0 && value <= 4 ? value as DailyLog['flow'] : fallback;
}

function dailyLogFromRow(row: LogRow): DailyLog | null {
  if (!isValidLocalDate(row.date)) return null;
  return {
    date: row.date,
    flow: scaleLevel(row.flow, 0),
    pain: scaleLevel(row.pain, 0),
    mood: scaleLevel(row.mood, 2),
    energy: scaleLevel(row.energy, 2),
    spotting: Boolean(row.spotting),
    discharge: typeof row.discharge === 'string' ? row.discharge : null,
    sexualActivity: row.sexual_activity === null ? null : Boolean(row.sexual_activity),
    notes: typeof row.notes === 'string' ? row.notes : '',
    symptoms: parseSymptomsJson(row.symptoms_json),
  };
}

export class DatabaseKeyUnavailableError extends Error {
  constructor() {
    super('database-key-unavailable');
    this.name = 'DatabaseKeyUnavailableError';
  }
}

export class EncryptedDatabaseOpenError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super('encrypted-database-open-failed');
    this.name = 'EncryptedDatabaseOpenError';
    this.cause = cause;
  }
}

export class CycleRepository {
  private db: SQLite.SQLiteDatabase | null = null;
  private initializationPromise: Promise<void> | null = null;
  private writeQueue: Promise<unknown> = Promise.resolve();

  async initialize() {
    if (this.db) return;
    if (this.initializationPromise) return this.initializationPromise;
    this.initializationPromise = this.initializeOnce();
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async initializeOnce() {
    const databaseExistedBeforeOpen = await this.databaseExists();
    let keyWasCreated = false;
    let key = await SecureStore.getItemAsync(DATABASE_KEY_NAME, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    if (!key) {
      try { assertDatabaseKeyState(key, databaseExistedBeforeOpen); } catch { throw new DatabaseKeyUnavailableError(); }
      key = bytesToHex(Crypto.getRandomBytes(32));
      await SecureStore.setItemAsync(DATABASE_KEY_NAME, key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
      keyWasCreated = true;
    }
    try {
      assertValidDatabaseKey(key);
    } catch {
      throw new DatabaseKeyUnavailableError();
    }

    let db: SQLite.SQLiteDatabase | null = null;
    try {
      db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      // SQLCipher requires the key to be the first operation on every native
      // connection. Verify it before running migrations or any other PRAGMA.
      await db.execAsync(`PRAGMA key = "x'${key}'"`);
      const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
      if (!cipher?.cipher_version) throw new Error('sqlcipher-unavailable');
      await db.getFirstAsync<{ count: number }>('SELECT count(*) AS count FROM sqlite_master');
      await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA secure_delete = ON;');
      await this.migrate(db);
      this.db = db;
    } catch (caught) {
      if (db) {
        try { await db.closeAsync(); } catch { /* The original database error is more useful. */ }
      }
      if (!databaseExistedBeforeOpen && keyWasCreated) {
        try {
          await this.deleteDatabaseArtifacts();
          await SecureStore.deleteItemAsync(DATABASE_KEY_NAME, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
        } catch { /* Preserve the original initialization error. */ }
      }
      throw new EncryptedDatabaseOpenError(caught);
    }
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

  private enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
    const operation = this.writeQueue.then(task, task);
    this.writeQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async migrate(db: SQLite.SQLiteDatabase) {
    const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    let version = result?.user_version ?? 0;
    assertSupportedDatabaseVersion(version, DATABASE_VERSION);
    if (version === 0) {
      // Do not use withExclusiveTransactionAsync with SQLCipher. Expo creates a
      // second native connection for it, and that connection has no PRAGMA key.
      await db.withTransactionAsync(async () => {
        await db.execAsync(`
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
        await db.runAsync('INSERT INTO app_settings (id, json) VALUES (1, ?)', JSON.stringify(defaultSettings));
      });
      version = 1;
    }
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }

  async listPeriodEvents(): Promise<PeriodEvent[]> {
    const rows = await this.requireDb().getAllAsync<PeriodRow>('SELECT id, start_date, end_date FROM period_events ORDER BY start_date');
    return rows
      .filter((row) => isValidLocalDate(row.start_date) && isValidLocalDate(row.end_date) && row.start_date <= row.end_date)
      .map((row) => ({ id: row.id, startDate: row.start_date, endDate: row.end_date }));
  }

  async getDailyLog(date: string): Promise<DailyLog | null> {
    const row = await this.requireDb().getFirstAsync<LogRow>('SELECT * FROM daily_logs WHERE date = ?', date);
    if (!row) return null;
    return dailyLogFromRow(row);
  }

  async listDailyLogs(): Promise<DailyLog[]> {
    const rows = await this.requireDb().getAllAsync<LogRow>('SELECT * FROM daily_logs ORDER BY date');
    return rows.map(dailyLogFromRow).filter((log): log is DailyLog => log !== null);
  }

  async saveDailyLog(log: DailyLog) {
    if (!isValidLocalDate(log.date)) throw new Error('invalid-local-date');
    await this.enqueueWrite(async () => {
      const db = this.requireDb();
      await db.withTransactionAsync(async () => {
        await db.runAsync(`INSERT INTO daily_logs (date, flow, pain, mood, energy, spotting, discharge, sexual_activity, notes, symptoms_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET flow=excluded.flow, pain=excluded.pain, mood=excluded.mood, energy=excluded.energy, spotting=excluded.spotting, discharge=excluded.discharge, sexual_activity=excluded.sexual_activity, notes=excluded.notes, symptoms_json=excluded.symptoms_json`,
          [log.date, log.flow, log.pain, log.mood, log.energy, Number(log.spotting), log.discharge, log.sexualActivity === null ? null : Number(log.sexualActivity), log.notes, JSON.stringify(log.symptoms)]);
        await this.rebuildPeriodEvents(db);
      });
    });
  }

  private async rebuildPeriodEvents(db: SQLite.SQLiteDatabase) {
    const rows = await db.getAllAsync<{ date: string }>('SELECT date FROM daily_logs WHERE flow > 0 AND spotting = 0 ORDER BY date');
    const groups = groupPeriodDates(rows.map((row) => row.date));
    await db.execAsync('DELETE FROM period_events;');
    for (const group of groups) await db.runAsync('INSERT INTO period_events (start_date, end_date) VALUES (?, ?)', group.start, group.end);
  }

  async getSettings(): Promise<UserSettings> {
    const row = await this.requireDb().getFirstAsync<{ json: string }>('SELECT json FROM app_settings WHERE id = 1');
    return parseSettingsJson(row?.json);
  }

  async saveSettings(settings: UserSettings) {
    await this.enqueueWrite(() => this.requireDb().runAsync('UPDATE app_settings SET json = ? WHERE id = 1', JSON.stringify(settings)));
  }

  async deleteAllData() {
    await this.enqueueWrite(async () => {
      const db = this.requireDb();
      await db.withTransactionAsync(async () => {
        await db.execAsync('DELETE FROM daily_logs; DELETE FROM period_events;');
        await db.runAsync('UPDATE app_settings SET json = ? WHERE id = 1', JSON.stringify(defaultSettings));
      });
    });
  }

  async resetEncryptedStorage() {
    await this.writeQueue;
    const db = this.db;
    this.db = null;
    if (db) await db.closeAsync();

    await this.deleteDatabaseArtifacts();
    await SecureStore.deleteItemAsync(DATABASE_KEY_NAME, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  }

  private async deleteDatabaseArtifacts() {
    if (await this.databaseExists()) await SQLite.deleteDatabaseAsync(DATABASE_NAME);
    // Native SQLite deletion only removes the main file. Clear possible sidecar
    // files as well so no encrypted remnants can affect a fresh database.
    for (const suffix of ['-wal', '-shm', '-journal']) {
      const sidecar = new File(Paths.document, 'SQLite', `${DATABASE_NAME}${suffix}`);
      if (sidecar.exists) sidecar.delete();
    }
  }
}

export const cycleRepository = new CycleRepository();
