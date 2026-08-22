import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const db = {
    execAsync: vi.fn(async (_query: string) => undefined),
    getFirstAsync: vi.fn(async (query: string) => {
      if (query === 'PRAGMA cipher_version') return { cipher_version: '4.6.1' };
      if (query.includes('sqlite_master')) return { count: 3 };
      if (query === 'PRAGMA user_version') return { user_version: 0 };
      return null;
    }),
    getAllAsync: vi.fn(async () => []),
    runAsync: vi.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    withTransactionAsync: vi.fn(async (task: () => Promise<void>) => task()),
    withExclusiveTransactionAsync: vi.fn(async (task: () => Promise<void>) => task()),
    closeAsync: vi.fn(async () => undefined),
  };
  return {
    db,
    openDatabaseAsync: vi.fn(async () => db),
    deleteDatabaseAsync: vi.fn(async () => undefined),
    getItemAsync: vi.fn(async () => 'a'.repeat(64)),
    setItemAsync: vi.fn(async () => undefined),
    deleteItemAsync: vi.fn(async () => undefined),
    deleteFile: vi.fn(),
  };
});

vi.mock('expo-file-system', () => ({
  Paths: { document: { uri: 'file:///data/user/0/app.yourcycle.mobile/files/' } },
  File: class MockFile {
    exists = true;
    delete = mocks.deleteFile;
  },
}));
vi.mock('expo-crypto', () => ({ getRandomBytes: vi.fn(() => new Uint8Array(32)) }));
vi.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only',
  getItemAsync: mocks.getItemAsync,
  setItemAsync: mocks.setItemAsync,
  deleteItemAsync: mocks.deleteItemAsync,
}));
vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: mocks.openDatabaseAsync,
  deleteDatabaseAsync: mocks.deleteDatabaseAsync,
}));

import { CycleRepository, EncryptedDatabaseOpenError } from '@/services/CycleRepository';

const sampleLog = {
  date: '2026-08-19',
  flow: 2 as const,
  pain: 1 as const,
  mood: 3 as const,
  energy: 2 as const,
  spotting: false,
  discharge: null,
  sexualActivity: null,
  notes: '',
  symptoms: [],
};

function successfulReads(query: string) {
  if (query === 'PRAGMA cipher_version') return Promise.resolve({ cipher_version: '4.6.1' });
  if (query.includes('sqlite_master')) return Promise.resolve({ count: 3 });
  if (query === 'PRAGMA user_version') return Promise.resolve({ user_version: 0 });
  return Promise.resolve(null);
}

describe('CycleRepository SQLCipher connection lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getItemAsync.mockResolvedValue('a'.repeat(64));
    mocks.db.getFirstAsync.mockImplementation(successfulReads);
    mocks.db.getAllAsync.mockResolvedValue([]);
    mocks.db.withTransactionAsync.mockImplementation(async (task: () => Promise<void>) => task());
    mocks.openDatabaseAsync.mockResolvedValue(mocks.db);
  });

  it('keys and verifies the main connection before migrating on that same connection', async () => {
    const repository = new CycleRepository();

    await repository.initialize();
    await repository.saveDailyLog(sampleLog);
    await repository.deleteAllData();

    expect(mocks.db.execAsync.mock.calls[0]?.[0]).toBe(`PRAGMA key = "x'${'a'.repeat(64)}'"`);
    expect(mocks.db.getFirstAsync).toHaveBeenCalledWith('PRAGMA cipher_version');
    expect(mocks.db.getFirstAsync).toHaveBeenCalledWith('SELECT count(*) AS count FROM sqlite_master');
    expect(mocks.db.withTransactionAsync).toHaveBeenCalledTimes(3);
    expect(mocks.db.withExclusiveTransactionAsync).not.toHaveBeenCalled();
  });

  it('coalesces concurrent initialization onto one keyed native connection', async () => {
    const repository = new CycleRepository();

    await Promise.all([repository.initialize(), repository.initialize()]);

    expect(mocks.openDatabaseAsync).toHaveBeenCalledTimes(1);
  });

  it('closes a failed native handle and can retry with a fresh open', async () => {
    let masterAttempts = 0;
    mocks.db.getFirstAsync.mockImplementation((query: string) => {
      if (query === 'PRAGMA cipher_version') return Promise.resolve({ cipher_version: '4.6.1' });
      if (query.includes('sqlite_master') && masterAttempts++ === 0) return Promise.reject(new Error('file is not a database'));
      return successfulReads(query);
    });
    const repository = new CycleRepository();

    await expect(repository.initialize()).rejects.toBeInstanceOf(EncryptedDatabaseOpenError);
    await repository.initialize();

    expect(mocks.db.closeAsync).toHaveBeenCalledTimes(1);
    expect(mocks.openDatabaseAsync).toHaveBeenCalledTimes(2);
  });

  it('deletes the database, sidecars, and key only after an explicit reset', async () => {
    const repository = new CycleRepository();
    await repository.initialize();

    await repository.resetEncryptedStorage();

    expect(mocks.db.closeAsync).toHaveBeenCalledTimes(1);
    expect(mocks.deleteDatabaseAsync).toHaveBeenCalledWith('your-cycle.db');
    expect(mocks.deleteFile).toHaveBeenCalledTimes(3);
    expect(mocks.deleteItemAsync).toHaveBeenCalledWith('your-cycle.database-key.v1', { keychainAccessible: 'device-only' });
  });
});
