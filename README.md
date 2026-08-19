<p align="center">
  <img src="assets/images/icon.png" width="144" alt="Your Cycle / Döngün logo" />
</p>

<h1 align="center">Your Cycle / Döngün</h1>

<p align="center">
  A private, bilingual period tracker for iOS and Android.<br />
  iOS ve Android için gizlilik odaklı, iki dilli adet takip uygulaması.
</p>

<p align="center">
  <strong>Free · Ad-free · Account-free · Offline-first</strong><br />
  <strong>Ücretsiz · Reklamsız · Hesapsız · Çevrimdışı</strong>
</p>

## About

Your Cycle is a privacy-first period tracker built with Expo, React Native, TypeScript, and Expo Router. Health records remain on the device: the app has no account system, backend, advertising, analytics, or cloud sync.

Döngün; Expo, React Native, TypeScript ve Expo Router ile geliştirilen gizlilik odaklı bir adet takip uygulamasıdır. Sağlık kayıtları cihazda kalır; hesap sistemi, sunucu, reklam, analiz veya bulut eşitleme kullanılmaz.

## Features

- Period calendar with completed and estimated dates
- Daily flow, pain, mood, energy, spotting, symptom, and note logging
- Adaptive median/MAD estimates based on local calendar dates
- English and Turkish interface
- Light, dark, and system themes
- Optional Face ID/fingerprint lock with device-passcode fallback
- Discreet local notifications
- Local PDF and UTF-8 CSV export
- Complete on-device data deletion
- Accessible labels, large tap targets, and non-color status indicators

## Privacy by design

- SQLCipher-encrypted local SQLite database
- Database key stored in device-only SecureStore
- Automatic cloud backup disabled for health records
- No networking layer or remote API
- No fertility, ovulation, contraception, pregnancy, diagnosis, or community features
- Exported files are temporary plaintext files and carry an explicit warning

See the [architecture](docs/architecture.md) and the draft [English](docs/privacy-policy.en.md) / [Turkish](docs/privacy-policy.tr.md) privacy policies for details.

## Run locally

SQLCipher requires a native development build and does not work in Expo Go.

```sh
npm ci
npm run prebuild:clean
npm run ios
# or
npm run android
```

## Verify

```sh
npm run typecheck
npm run lint
npm test
npx expo-doctor
```

The test suite covers predictions, sparse and irregular histories, leap years, timezone-safe date arithmetic, CSV escaping, Turkish characters, and repository privacy policies.

## Project structure

```text
src/app/          Screens and Expo Router navigation
src/components/   Calendar, logging, loading, and lock UI
src/domain/       Local-date models and domain types
src/services/     Encrypted storage, predictions, reminders, exports, lock
src/state/        App and theme state
src/i18n/         English and Turkish copy
docs/             Architecture, privacy, clinical, test, and release notes
privacy-site/     Publish-ready bilingual privacy-policy pages
tests/            Unit and privacy-policy tests
```

## Release status

This repository contains a production MVP, not a released medical product. Store submission remains gated on name clearance, clinical and privacy review, bilingual copy approval, physical-device testing, signing, store declarations, and publisher approval.

## Medical disclaimer

This app is for personal record keeping only. It is not a medical device, does not provide medical advice, and must not be used as contraception. Seek professional care for health concerns.

## License

[MIT](LICENSE)
