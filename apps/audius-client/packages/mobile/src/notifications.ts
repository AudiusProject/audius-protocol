import type { Nullable } from '@audius/common'
import { FeatureFlags } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types'
import type { ParamListBase } from '@react-navigation/native'
import type { PushNotificationPermissions } from 'react-native'
import { Platform } from 'react-native'
import Config from 'react-native-config'
// https://dev.to/edmondso006/react-native-local-ios-and-android-notifications-2c58
import PushNotification from 'react-native-push-notification'

import { track, make } from 'app/services/analytics'
import {
  getFeatureEnabled,
  remoteConfigInstance
} from 'app/services/remote-config'
import { EventNames } from 'app/types/analytics'

type Token = {
  token: string
  os: string
}

type BottomTabNavigation = BottomTabNavigationProp<ParamListBase>

// Set to true while the push notification service is registering with the os
let isRegistering = false

const getPlatformConfiguration = () => {
  if (Platform.OS === 'android') {
    console.info('Fcm Sender ID:', Config.FCM_SENDER_ID)
    return {
      senderID: Config.FCM_SENDER_ID,
      requestPermissions: true,
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_notification'
    }
  } else {
    return {
      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true
      },
      // Turn the initial permissions request off
      requestPermissions: false
    }
  }
}

// Singleton class
class PushNotifications {
  lastId: number
  token: Token | null
  drawerHelpers: DrawerNavigationHelpers | null
  bottomTabNavigation: Nullable<BottomTabNavigation>

  // onNotification is a function passed in that is to be called when a
  // notification is to be emitted.
  constructor() {
    this.configure()
    this.lastId = 0
    this.token = null
    this.bottomTabNavigation = null
  }

  setDrawerHelpers(helpers: DrawerNavigationHelpers) {
    this.drawerHelpers = helpers
  }

  setBottomTabNavigation = (bottomTabNavigation: BottomTabNavigation) => {
    this.bottomTabNavigation = bottomTabNavigation
  }

  onNotification = async (notification: any) => {
    console.info(`Received notification ${JSON.stringify(notification)}`)
    if (notification.userInteraction || Platform.OS === 'android') {
      track(
        make({
          eventName: EventNames.NOTIFICATIONS_OPEN_PUSH_NOTIFICATION,
          ...(notification.message
            ? {
                title: notification.message.title,
                body: notification.message.body
              }
            : {})
        })
      )

      await remoteConfigInstance.waitForRemoteConfig()
      const isNavOverhaulEnabled = await getFeatureEnabled(
        FeatureFlags.MOBILE_NAV_OVERHAUL
      )

      if (isNavOverhaulEnabled) {
        this.bottomTabNavigation?.navigate('notifications')
      } else {
        this.drawerHelpers?.openDrawer()
      }
    }
  }

  async onRegister(token: Token) {
    console.log('REGISTER DEVICE TOKEN', token)
    this.token = token
    await AsyncStorage.setItem('@device_token', JSON.stringify(token))
    isRegistering = false
  }

  deregister() {
    AsyncStorage.removeItem('@device_token')
  }

  async configure() {
    PushNotification.configure({
      onNotification: this.onNotification,
      onRegister: this.onRegister,

      popInitialNotification: false,
      ...getPlatformConfiguration()
    })

    try {
      const token = await AsyncStorage.getItem('@device_token')
      if (token) {
        this.token = JSON.parse(token)
      } else {
        console.info(`Device token not found`)
      }
    } catch (e) {
      console.error(`Device token read error`)
    }
  }

  requestPermission() {
    isRegistering = true
    PushNotification.requestPermissions()
  }

  checkPermission(
    callback: (permissions: PushNotificationPermissions) => void
  ) {
    return PushNotification.checkPermissions(callback)
  }

  cancelNotif() {
    PushNotification.cancelLocalNotifications({ id: '' + this.lastId })
  }

  cancelAll() {
    PushNotification.cancelAllLocalNotifications()
  }

  setBadgeCount(count: number) {
    PushNotification.setApplicationIconBadgeNumber(count)
  }

  async getToken() {
    // Wait until the device token and OS are persisted to async storage
    // isRegistering modified as global
    // eslint-disable-next-line no-unmodified-loop-condition
    while (isRegistering) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    const token = await AsyncStorage.getItem('@device_token')
    if (token) {
      return JSON.parse(token)
    }
    return {}
  }
}

const notifications = new PushNotifications()

export default notifications
