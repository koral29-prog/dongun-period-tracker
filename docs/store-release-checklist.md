# Store release checklist

## Publisher prerequisites

- [ ] Clear the names “Your Cycle” and “Döngün” for trademarks and confusingly similar store listings in target markets.
- [ ] Finalize legal publisher name, support email, privacy contact, publisher identity, Apple Developer account, and Google Play developer account.
- [ ] Replace `app.yourcycle.mobile` if the cleared publisher requires another bundle/package identifier.
- [ ] Publish the English and Turkish privacy pages over HTTPS and enter the final URLs in the app and both stores.

## Review gates

- [ ] Clinical review signed for English and Turkish.
- [ ] Privacy/legal review signed for local encryption, deletion, exports, reminders, biometrics, and minors 13+.
- [ ] Bilingual product copy and screenshot copy approved.
- [ ] Native acceptance plan passed on physical/store-equivalent devices.
- [ ] CocoaPods 1.15.2+ installed; `expo-doctor` has 21/21 checks passing.
- [ ] Dependency audit reviewed; build-tool advisories have a documented disposition or patched SDK release.

## Apple App Store Connect

- [ ] Privacy policy URL and support URL are public.
- [ ] App Privacy answers accurately state that the publisher does not collect data remotely.
- [ ] Age-rating questionnaire completed for a 13+ product target; do not select the Kids category.
- [ ] Non-medical positioning is clear in metadata and review notes.
- [ ] TestFlight internal and external testing passed before production submission.

## Google Play Console

- [ ] Data Safety form accurately states no remote collection or sharing.
- [ ] Health Apps declaration selects “Period Tracking.”
- [ ] State that the app is not a medical device and does not provide medical, fertility, or contraception advice.
- [ ] Target audience excludes users under 13.
- [ ] Closed testing and required tester-duration rules are completed before production access.

## Assets and release

- [ ] Localized name, subtitle/short description, long description, keywords, screenshots, app icon, feature graphic, and review notes finalized.
- [ ] EAS production builds are signed with publisher-owned credentials.
- [ ] Release builds pass network inspection, export cleanup, backup exclusion, accessibility, and deletion checks.
- [ ] No HealthKit, Health Connect, cloud, subscription, advertising, telemetry, fertility, pregnancy, or community capability is introduced without a new review.
