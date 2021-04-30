# Audius Mobile Client

The Audius React Native mobile client.
It can be run against a local client or against a production build.

**General setup**

Pull a the latest dapp from s3:

```
# Make sure you have s3 creds set up and the aws cli installed.
npm run copy:remote-production
```

Copy environment variables and replace missing values (you will need an FCM sender id as well as a Segment write key)

```
cp .env.stage.tmpl .env.stage
cp .env.prod.tmpl .env.prod
```

**iOS**
```
# install cocoapods
sudo gem install cocoapods
# install local dependencies
npm install 

cd ios
pod install
cd ..

# Run a simulator
npm run ios
# Run a simulator pointed at localhost (you may wish to modify the port in .env.dev)
npm run ios:dev
# Run the app on a device
npm run ios:device "Raymond's iPhone"
# To see available devices
xcrun xctrace list devices
```

**Android**
```
# Run a simulator
npm run android
# Run a simulator pointed at localhost (you may wish to modify the port in .env.dev)
npm run android:dev

# Look at android devices
adb devices
# Connect device to dev server
adb -s <device name> reverse tcp:8081 tcp:8081
# Run on device
npm run android
```

If you run into issues, try cleaning the android build folder
```
cd android && ./gradlew clean && cd ..
```

## Debugging

* To debug the native-layer of the app, install [React Native Debugger](https://github.com/jhen0409/react-native-debugger) and enable debugging (Cmd + D) in the simulator.
* Safari can also be used to debug against the WebView running the dapp. This can be seen by opening Safari > Develop > Device > Localhost.

On Android, you can use the adb Android Studio tool or
```
# Show device logs
adb logcat '*:V'
```

## Helpful

* Sometimes the simulator app code won't update. You should disable caching in `settings/Network` of React Native Debugger.
* If you feel like debugging the actual static app contained in the build, you can:
```
npm install -g serve --user
serve -s web-app/Web.bundle/build -p 9000
```