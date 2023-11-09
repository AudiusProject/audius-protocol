# Audius Mobile Client

The Audius React Native mobile client

## Setup

## Running iOS

```bash
# Create the ios bundle. Should only have to run once.
npm run bundle:ios

# Start the react-native server
npm run mobile

# Run a simulator using a prod configuration
npm run ios
# Run a simulator using a stage configuration
npm run ios:stage
# Run a simulator using a dev configuration
npm run ios:dev

# Run the app on a device
npm run ios:device "Raymond's iPhone"
# To see available devices
xcrun xctrace list devices
```

## Running Android

```bash
# Start the react-native server
npm run mobile

# Run a simulator using a prod configuration
npm run android
# Run a simulator using a stage configuration
npm run android:stage
# Run a simulator using a dev configuration
npm run android:dev

# Look at android devices
adb devices
# Connect device to dev server
adb -s <device name> reverse tcp:8081 tcp:8081
# Run on device
npm run android
```

If you run into issues, try cleaning the android build folder

```bash
cd android && ./gradlew clean && cd ..
```

## Debugging

- To debug the app, install [Flipper](https://fbflipper.com/) either through their website, or using brew `brew install --cask flipper`.

> Note as of time of writing, flipper is not signed correctly, and macos will prevent Flipper from opening. To override this, follow the resulting popup's instructions (go to security and confirm you want to open Flipper)

We use a few different plugins as a team, make sure to install and enable the various plugins in flipper GUI

- Hermes (default)
- React Devtools (default)
- Network Inspector (default)
- Layout (default)
- Shared Preferences Viewer (default)
- [Redux Debugger](https://github.com/jk-gan/flipper-plugin-redux-debugger)
- [advanced-async-storage](https://github.com/lbaldy/flipper-plugin-async-storage-advanced)
- [performance](https://github.com/oblador/react-native-performance)
- [react-native-performance-monitor](https://github.com/bamlab/react-native-flipper-performance-monitor)

On Android, you can use the adb Android Studio tool or

```bash
# Show device logs
adb logcat '*:V'
```

- Sometimes the app will crash due a configuration error or something outside of the realm of JS and you won't get any helpful information from React Native. In those cases, it's time to break open XCode and run from there to pinpoint the issue.

## Helpful

- If your app is crashing after running for a second, or crashing on startup with no error message, it's probably an environment variable problem, and you should check to make sure you have them all. Debug using XCode.

- Other commands and things:

```
# opens debug menu on an Android device
adb shell input keyevent 82
```

```
# Busts the package cache for RN
npm start -- --reset-cache
```

```
# Clean build
# first manually close all running instances of metro
watchman watch-del-all
npm start -- --reset-cache
npm run ios:dev
```
