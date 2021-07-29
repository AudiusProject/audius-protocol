# Audius Mobile Client

The Audius React Native mobile client.
It can be run against a local client or against a production build.

## Setup

Copy the environment variables and replace missing values (you will need an FCM sender id as well as a Segment write key)

```bash
cp .env.dev.tmpl .env.dev
cp .env.stage.tmpl .env.stage
cp .env.prod.tmpl .env.prod
```

## Running against localhost

To run against localhost, specify `URL_OVERRIDE` in `.env.dev`:

```
URL_OVERRIDE=http://localhost:3001
```

> The WebView will be pointed at the url contained in `URL_OVERRIDE`

## Running against a local static build

To run against a local staging or production build, build the client and copy the build into the mobile client:

```bash
# staging

# audius-client
npm run build:mobile-stage

# audius-mobile-client
npm run copy:local-staging

# production

# audius-client
npm run build:mobile-prod

# audius-mobile-client
npm run copy:local-production
```

## Running against a remote static build

To run against a remote staging or production build, pull a the latest dapp from s3:

> Make sure you have s3 creds set up and the aws cli installed.

```bash
# staging
npm run copy:remote-staging

# production
npm run copy:remote-production
```

## iOS

```bash
# install cocoapods
sudo gem install cocoapods
# install local dependencies
npm install

cd ios
pod install
cd ..

# Run a simulator pointed at a static build
npm run ios
# Run a simulator pointed at localhost
npm run ios:dev
# Run the app on a device
npm run ios:device "Raymond's iPhone"
# To see available devices
xcrun xctrace list devices
```

## Android

```bash
# Run a simulator pointed at a static build
npm run android
# Run a simulator pointed at localhost
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

## Helpful

- Sometimes the simulator app code won't update. You should disable caching in `settings/Network` of React Native Debugger.
- If you feel like debugging the actual static app contained in the build, you can:

```bash
npm install -g serve --user
serve -s web-app/Web.bundle/build -p 9000
```
