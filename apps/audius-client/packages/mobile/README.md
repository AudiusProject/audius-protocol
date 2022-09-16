# Audius Mobile Client

The Audius React Native mobile client.

This project is a React Native wrapper around the Audius web client, and requires a web client to be running.
The native project can be built & run against a local client (serving at localhost) or against a vendored staging/production build.

## Setup

Copy the environment variables and replace missing values. (You will need an FCM sender id as well as a Segment write key for those services to work properly, but any value will suffice if the data is not important to you.)

```bash
cp .env.dev.tmpl .env.dev
cp .env.stage.tmpl .env.stage
cp .env.prod.tmpl .env.prod
```

### Extra iOS Setup

```bash
# install cocoapods
sudo gem install cocoapods

cd ios
pod install
cd ..
```

## Running iOS

```bash
# Run a simulator using a prod configuration
npm run ios
# Run a simulator using a stage configuration
npm run ios:bounce
# Run a simulator using a dev configuration
npm run ios:dev

# Run the app on a device
npm run ios:device "Raymond's iPhone"
# To see available devices
xcrun xctrace list devices
```

## Running Android

```bash
# Run a simulator using a prod configuration
npm run android
# Run a simulator using a stage configuration
npm run android:bounce
# Run a simulator using a dev configuration
npm run android:dev

# Look at android devices
adb devices
# Connect device to dev server
adb -s <device name> reverse tcp:8081 tcp:8081
# If connecting to localhost, set up port forwarding
adb -s <device name> reverse tcp:3001 tcp:3001
# Run on device
npm run android
```

If you run into issues, try cleaning the android build folder

```bash
cd android && ./gradlew clean && cd ..
```

## Debugging

- To debug the native-layer of the app, install [React Native Debugger](https://github.com/jhen0409/react-native-debugger) and enable debugging (Cmd + D) in the simulator.
- Safari can also be used to debug against the WebView running the dapp. This can be seen by opening Safari > Develop > Device > Localhost.

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

- Debugging Android webview: https://github.com/react-native-webview/react-native-webview/blob/master/docs/Debugging.md#android--chrome
