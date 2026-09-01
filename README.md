# QuietRoutine

A mobile app that keeps your phone silenced in the right places and at the right times — so you never forget to turn silent mode on or off.

## Features

### Location-based silence
- **Live map** with your current position
- **Draw zones** on the map by tapping points, or pick a **radius** of 1m, 10m, or 100m from your location
- Small zones use live GPS; larger zones use background geofencing

### Calendar-based silence
- **Google Calendar** — import events from calendars synced on your device (Google on Android, or Google added in iOS Settings)
- **Built-in calendar** — create events with start/end times and dates
- **Custom end time** — silence can end at the calendar end or a time you choose
- **Reminders** — notification 30 minutes before (or 5m, 15m, 60m, or a custom value)

### Always-on status
- Persistent notification: **"Phone is silenced"** or **"Phone is not silenced"**
- Shows on lock screen and notification shade with the QuietRoutine icon

### Daily routines
- Plan your day with timed blocks linked to silent zones

## Stack

- [Expo SDK 54](https://expo.dev/changelog/sdk-54) + [React Native](https://reactnative.dev) (compatible with **App Store Expo Go**)
- [react-native-maps](https://github.com/react-native-maps/react-native-maps) for the zone map
- [expo-location](https://docs.expo.dev/versions/latest/sdk/location/) for geofencing and GPS
- [expo-calendar](https://docs.expo.dev/versions/latest/sdk/calendar/) for Google/device calendar
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) for status and reminders

## Run locally

```bash
npm install
npm start
```

Scan the QR code with **Expo Go from the App Store** (SDK 54) on your phone for full map, location, and notification behavior.

Web preview (UI only — map drawing and silence require a device):

```bash
npm run web
```

## Permissions

On first launch, QuietRoutine asks for:

1. **Location (including background)** — detect silent zones and live position on the map
2. **Notifications** — always-on silence status and event reminders
3. **Calendar (optional)** — import Google Calendar or device calendar events

## Platform notes

- **Android** — Full geofencing, GPS zones, calendar import, and persistent notifications.
- **iOS** — Geofencing and notifications work. Third-party apps cannot change the system ringer; QuietRoutine shows a persistent reminder and can integrate with Focus modes for system-level silence.

## Project structure

```
app/           Expo Router screens (Home, Zones, Routine, Schedule)
components/    Map, permissions gate, shared UI
context/       App state and silence orchestration
lib/           Storage, geofencing, calendar, reminders, notifications
```

## Example workflow

1. **Zones** — open the map, pick 10m radius or draw your office outline, save "Office".
2. **Schedule** — import a Google Calendar meeting or add "Client call" 11:00–12:00 with a 30m reminder.
3. **Home** — see "Phone is silenced" when you enter Office or when the meeting starts; the lock screen notification stays visible.
