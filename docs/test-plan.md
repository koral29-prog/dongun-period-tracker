# Native acceptance test plan

Automated checks currently cover local-date arithmetic, sparse/irregular prediction, recent-six selection, leap years, DST boundaries, backdated edits, Turkish disclaimers, CSV escaping and encoding, key-loss policy, schema-version rejection, and period-event reconstruction.

Run locally:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npx expo prebuild --clean
npx expo-doctor
```

## Device matrix

- Current public iOS on an iPhone with Face ID and an iPhone or simulator with device-passcode fallback.
- Current public Android on a Pixel-class physical device with fingerprint/device credential.
- One small screen and one large-text configuration per platform.
- English and Turkish on every core flow.

## Required end-to-end flows

- [ ] First launch → 13+ confirmation → baseline setup → log flow → edit a backdated day → estimate updates.
- [ ] Spotting alone never creates a `PeriodEvent`; adjacent flow dates merge; removing flow reconstructs events.
- [ ] Reminder enable asks once; denial keeps reminders off; timezone change and period edit reschedule locally.
- [ ] Background beyond grace period locks; success unlocks; cancellation/failure/lockout stays locked; passcode fallback works.
- [ ] PDF paginates with long history and Turkish text; CSV opens with Turkish characters and correct quotes/newlines.
- [ ] Share cancellation and success remove temporary files; relaunch removes an orphaned export.
- [ ] Delete all removes logs, periods, settings, scheduled notifications, and temporary exports.
- [ ] Simulated SecureStore key loss shows the explicit unrecoverable-key state and does not overwrite the database.
- [ ] Upgrade from each shipped encrypted schema applies migrations without data loss; downgrade/newer schema is rejected.

## Accessibility

- [ ] VoiceOver and TalkBack traverse date cells, scale choices, switches, sheets, and destructive confirmations logically.
- [ ] Dynamic Type / Android font scaling does not clip English or Turkish text.
- [ ] Tap targets are at least 44×44 pt/dp where practical.
- [ ] Logged, estimated, selected, and current dates differ by border/fill/dot, not color alone.
- [ ] Contrast is checked for forest, coral, sage, disabled, and secondary text states.

## Privacy verification

- [ ] Inspect release builds with a network proxy in airplane mode and online mode; normal app use must produce no application network requests.
- [ ] Confirm no remote push token method is called and no backend URL is present in the bundle.
- [ ] Confirm Android manifest has `android:allowBackup="false"`.
- [ ] Confirm the iOS SQLite directory has `NSURLIsExcludedFromBackupKey = true` after first launch.
- [ ] Inspect release binary dependencies for analytics, ads, attribution, crash reporting, or social SDKs.
