# Clawbound native release

This repository contains the complete web game and a bundled Capacitor native shell. The shell loads local assets, not a hosted URL. It does not add advertising, analytics, login, purchases, or remote code updates.

**Status:** source packaging is prepared. A signed store binary and physical-device acceptance are separate, outstanding release steps. Do not describe this source bundle as an App Store or Google Play approved build.

## Android

Install Node 22 or newer, Android Studio 2025.2.1 or newer, and the Android SDK required by the generated `mobile/android/variables.gradle`. Android Studio provides a compatible JDK.

From `mobile/`:

```sh
npm ci
npm run android:open
```

Android Studio opens the local native project with every game asset bundled. Use Build → Generate Signed Bundle / APK → Android App Bundle. Select the owner's existing upload key or create a new key in Android Studio and keep its passwords and backup outside this repository. Never place signing secrets in git. The owner must control the final package ID `com.roxorloops.clawbound`; confirm that ID before the first store upload because a published package ID cannot be replaced in place.

For an unsigned bundle on an already configured SDK machine:

```sh
npm run android:bundle
```

The Gradle output is `mobile/android/app/build/outputs/bundle/release/`. An unsigned AAB is not ready to upload. For later updates increment the `versionCode` in `scripts/configure-native.cjs` and the version in `mobile/package.json` before generating another binary.

## iOS

On macOS with Xcode 26 or newer and its command-line tools, from `mobile/`:

```sh
npm ci
npm run ios:open
```

The native Xcode project is included. Capacitor 8 uses Swift Package Manager by default. Set the owner's Apple Developer team, bundle identifier, version and build number in Xcode. Archive for a physical iOS device, validate, then distribute through App Store Connect. Signing certificates and provisioning profiles remain in the owner's Apple account/keychain.

Review the final Xcode archive's aggregated privacy manifest. This game does not install native data-collection plugins; adding one later requires reviewing its permissions, required-reason APIs, and disclosures before release.

## Store materials

- Display name: **Clawbound: The Sunken Vault**.
- Short description: **Scoop your weapons. Forge your build. Crack the vault.**
- Category: Games; strategy / roguelike.
- Privacy URL: `https://roxorloops1337.github.io/claw-rogue/privacy.html` after deploying this commit.
- Support URL: `https://github.com/RoxorLoops1337/claw-rogue/issues`.
- App behavior: single-player; locally saved progress; no account; no ads, analytics, purchases, or player communication.
- Complete the store's content-rating and data-disclosure questionnaires from the final shipped binary. Do not infer a rating merely from the intended audience.
- Capture screenshots from the final binary on supported phones; don't use generated gameplay mockups as store screenshots.
- Pricing, availability, legal publisher details, and store account enrollment remain owner decisions.

## Acceptance before signing off

Run the full repository checks, then play the final native build on a physical Android phone and iPhone. Check first launch, airplane-mode cold launch, audio after interruptions, mute persistence, save/resume after force quit, a complete campaign, loss/restart, touch near safe-area edges, small screens, large text, reduced motion, and sustained performance/battery use. Confirm that every screenshot matches the submitted binary. Record device, OS, binary version, results, and any unresolved problem in the release record.

These steps require the actual devices and store owner's credentials; automated JavaScript tests or a web deployment cannot establish them.

## Primary documentation

Verified against the current Capacitor 8 documentation on 24 September 2026:

- [Environment and platform requirements](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Native build workflow](https://capacitorjs.com/docs/basics/workflow)
- [Google Play deployment](https://capacitorjs.com/docs/android/deploying-to-google-play)
- [App Store deployment](https://capacitorjs.com/docs/ios/deploying-to-app-store)
- [iOS privacy manifests](https://capacitorjs.com/docs/ios/privacy-manifest)
