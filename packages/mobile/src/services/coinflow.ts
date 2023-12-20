import { NativeModules, Platform } from 'react-native'
const nsureSDK = NativeModules.NSureSDK

const APP_ID = process.env.VITE_COINFLOW_APP_ID
let deviceId: string

export const getCoinflowDeviceId = (): string => {
  if (deviceId !== undefined) {
    return deviceId
  }

  console.log(APP_ID)

  if (Platform.OS === 'ios') {
    nsureSDK.sharedInstanceWithAppID(
      APP_ID,
      (_: unknown, _deviceId: string) => {
        deviceId = _deviceId ?? ''
      }
    )
  } else if (Platform.OS === 'android') {
    nsureSDK.getDeviceId(APP_ID, (_deviceId: string) => {
      deviceId = _deviceId ?? ''
    })
  } else {
    deviceId = ''
  }

  return deviceId
}
