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

### iOS

```bash
# install cocoapods
sudo gem install cocoapods
# install local dependencies
npm install

cd ios
pod install
cd ..

# Create main.jsbundle
npm run bundle:ios
```
### Android

```bash
# install local dependencies
npm install
```

## Running against localhost

To run against localhost, specify `URL_OVERRIDE` in the `.env` file you intend to use.

```
URL_OVERRIDE=http://localhost:3001
```

> The WebView will be pointed at the url contained in `URL_OVERRIDE`

This URL should be a serving a mobile audius-client with either

`npm run start:mobile-stage` or `npm run start:mobile-prod`

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

## Android

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

## Helpful

- Sometimes the simulator app code won't update. You should disable caching in `settings/Network` of React Native Debugger.
- If you feel like debugging the actual static app contained in the build, you can:

```bash
npm install -g serve --user
serve -s web-app/Web.bundle/build -p 9000
```
