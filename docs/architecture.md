# Architecture and privacy boundaries

## Product boundary

Your Cycle is an offline-only iOS and Android app. It has no account system, HTTP client, backend, analytics SDK, advertising SDK, remote notification token registration, cloud synchronization, HealthKit/Health Connect integration, fertility model, diagnosis, community, or payments.

## Local data

- `PeriodEvent` is reconstructed from adjacent dates where the user explicitly logged menstrual flow. Spotting is excluded.
- `DailyLog` stores flow, pain, mood, energy, spotting, discharge, optional sexual activity, notes, and custom symptoms under a local calendar date.
- `UserSettings` stores locale, enabled trackers, reminder settings, notification privacy, app lock, onboarding baseline, and grace period.
- `CycleEstimate` is computed in memory from the latest six valid completed start-to-start intervals.

`CycleRepository` opens `your-cycle.db` with SQLCipher and applies the key immediately after opening. The 256-bit random key is stored with `expo-secure-store` using `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. If the key is unavailable while the encrypted database still exists, the app refuses to regenerate a key and surfaces an explicit recovery error.

Android backup is disabled in the manifest. The custom Expo config plugin marks the iOS `Library/SQLite` directory as excluded from backup before React Native starts. Prebuild verification must confirm both settings after every Expo SDK change.

## Prediction rules

- Local `YYYY-MM-DD` values are parsed into UTC calendar components only for arithmetic, so DST and timezone offsets cannot shift a date.
- Valid recent cycle intervals are 15–90 days; no more than the latest six are used.
- The median interval is the center.
- The range is at least ±2 days, widened to `ceil(MAD × 1.5)`, and capped at ±7 days.
- Fewer than two supporting intervals use the onboarding baseline and ±3 days.
- The UI always shows supporting-cycle count and a non-contraceptive, non-medical disclaimer.

## Local system services

- `ReminderScheduler` requests notification permission only when reminders are enabled, creates a silent/private Android channel, schedules local calendar reminders, and cancels before rescheduling.
- `PrivacyLock` uses system authentication with device-passcode fallback. It is triggered after the configured background grace period.
- `ExportService` writes UTF-8 CSV or cache-directory PDF files, warns that they are plaintext, shares through the native sheet, and deletes each file in `finally`. Orphaned files with the export prefix are removed at the next launch.

## Deliberate failure modes

- Key loss does not silently erase or replace encrypted data.
- A database schema newer than the app is rejected before the schema version is changed.
- Notification denial leaves reminders disabled.
- Cancelled/failed authentication keeps the lock visible.
- Share-sheet cancellation still deletes the temporary export.
