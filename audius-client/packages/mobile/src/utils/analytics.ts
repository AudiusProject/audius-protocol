import { Platform } from 'react-native'
import analytics, { JsonMap } from '@segment/analytics-react-native'
import Config from "react-native-config"
import { Identify, Track, Screen, AllEvents } from '../types/analytics'

let analyticsSetupStatus: 'ready' | 'pending' | 'error' = 'pending'

let SegmentWriteKey = Platform.OS === 'android'
  ? Config.SEGMENT_ANDROID_WRITE_KEY
  : Config.SEGMENT_IOS_WRITE_KEY

export const setup = async () => {
  try {
    console.info('Analytics setup')
    await analytics.setup(SegmentWriteKey, {
      // Record screen views automatically!
      recordScreenViews: false,
      // Record certain application events automatically!
      trackAppLifecycleEvents: true
    })
    analyticsSetupStatus = 'ready'
    console.info('Analytics ready')
  } catch (err) {
    analyticsSetupStatus = 'error'
    console.info('Analytics error')
    console.log(err)
  }
}

const isAudiusSetup = async () => {
  if (analyticsSetupStatus === 'pending') {
    const ready = await new Promise((resolve, reject) => {
      const checkStatusInterval = setInterval(() => {
        if (analyticsSetupStatus === 'pending') return
        clearInterval(checkStatusInterval)
        if (analyticsSetupStatus === 'ready') resolve(true)
        resolve(false)
      }, 500)
    })
    return ready
  } else if (analyticsSetupStatus === 'ready') return true
  else {
    return false
  }
}

export const make = (event: AllEvents) => {
  const { eventName, ...props } = event
  return {
    eventName,
    properties: props as any
  }
}

// Identify User
// Docs: https://segment.com/docs/connections/spec/identify
export const identify = async ({ handle, traits }: Identify) => {
  const isSetup = await isAudiusSetup()
  if (!isSetup) return
  console.info('Analytics identify', handle, traits)
  analytics.identify(handle, traits)
}

// Track Event
// Docs: https://segment.com/docs/connections/spec/track/
export const track = async ({ eventName, properties }: Track) => {
  const isSetup = await isAudiusSetup()
  if (!isSetup) return
  console.info('Analytics track', eventName, properties)
  analytics.track(eventName, properties)
}

// Screen Event
// Docs: https://segment.com/docs/connections/sources/catalog/libraries/mobile/react-native/#screen
export const screen = async ({ route, properties }: Screen) => {
  const isSetup = await isAudiusSetup()
  if (!isSetup) return
  console.info('Analytics screen', route, properties)
  analytics.screen(route, properties)
}
