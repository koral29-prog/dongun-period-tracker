import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fileConstructor, documentDirectory } = vi.hoisted(() => ({
  fileConstructor: { args: [] as unknown[] },
  documentDirectory: { uri: 'file:///data/user/0/app.yourcycle.mobile/files/' },
}));

vi.mock('expo-file-system', () => ({
  Paths: { document: documentDirectory },
  File: class MockFile {
    exists = true;

    constructor(...args: unknown[]) {
      fileConstructor.args = args;
    }
  },
}));
vi.mock('expo-crypto', () => ({ getRandomBytes: vi.fn() }));
vi.mock('expo-secure-store', () => ({ WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' }));
vi.mock('expo-sqlite', () => ({}));

import { CycleRepository } from '@/services/CycleRepository';

describe('CycleRepository database location', () => {
  beforeEach(() => {
    fileConstructor.args = [];
  });

  it('checks the SQLite file from an absolute FileSystem directory URI', async () => {
    const repository = new CycleRepository();

    await (repository as unknown as { databaseExists(): Promise<boolean> }).databaseExists();

    expect(fileConstructor.args).toEqual([documentDirectory, 'SQLite', 'your-cycle.db']);
    expect(documentDirectory.uri).toMatch(/^file:\/\//);
  });
});
