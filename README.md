# QuietRoutine

A mobile app that keeps your phone quiet based on where you are, what you're doing, and what's on your schedule.

## Features

- **Silent zones** — Define places (office, library, gym) and automatically enter silence when you arrive. A background notification reminds you the phone is currently silenced.
- **Daily routines** — Build your day step by step with duration for each block and see a timeline of how long everything takes.
- **Scheduled silence** — Add a meeting from 11:00 to 12:00 and the app silences automatically for that hour.
- **Manual silence** — Tap "Silence now" on the home screen any time.

## Stack

- [Expo](https://expo.dev) + [React Native](https://reactnative.dev)
- [expo-location](https://docs.expo.dev/versions/latest/sdk/location/) for geofencing
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) for the persistent silence reminder
- [expo-task-manager](https://docs.expo.dev/versions/latest/sdk/task-manager/) for background zone detection

## Run locally

```bash
npm install
npm start
```

Then scan the QR code with **Expo Go** on your phone, or press `a` for Android emulator / `i` for iOS simulator.

For web preview (UI only — location/geofencing require a device):

```bash
npm run web
```

## Permissions

On first launch the app asks for:

1. **Location (including background)** — to detect when you enter or leave silent zones
2. **Notifications** — to show the "Currently silenced" reminder in the background

## Platform notes

- **Android** — Full geofencing and background silence notifications work with the permissions above.
- **iOS** — Geofencing and silence notifications work, but iOS does not allow third-party apps to change the system ringer or Do Not Disturb. QuietRoutine shows a persistent reminder notification; use Focus modes for system-level silence if needed.

## Project structure

```
app/           Expo Router screens (Home, Zones, Routine, Schedule)
components/    Shared UI
context/       App state and silence orchestration
lib/           Storage, geofencing, schedule logic, notifications
```

## Example workflow

1. Open **Zones** → tap "Use current location" → save "Office" with a 150m radius.
2. Open **Routine** → add "Deep work" (90 min) linked to Office.
3. Open **Schedule** → add "Client call" from 11:00 to 12:00.
4. When you enter Office or the meeting starts, home shows **Currently silenced** and a notification appears in the background.
