import { NativeModules, Platform } from 'react-native'

import { env } from 'app/env'

const nsureSDK = NativeModules.NSureSDK

let deviceId: string

export const getCoinflowDeviceId = (): string => {
  if (deviceId !== undefined) {
    return deviceId
  }

  /* Bail early if native module isn't found */
  if (!nsureSDK) {
    console.warn('Native module NSureSDK not found')
    deviceId = ''
    return deviceId
  }

  if (Platform.OS === 'ios') {
    nsureSDK.sharedInstanceWithAppID(
      env().COINFLOW_APP_ID,
      env().COINFLOW_PARTNER_ID,
      (_: unknown, _deviceId: string) => {
        deviceId = _deviceId ?? ''
      }
    )
  } else if (Platform.OS === 'android') {
    nsureSDK.getDeviceId(
      env().COINFLOW_APP_ID,
      env().COINFLOW_PARTNER_ID,
      (_deviceId: string) => {
        deviceId = _deviceId ?? ''
      }
    )
  } else {
    deviceId = ''
  }

  return deviceId
}
