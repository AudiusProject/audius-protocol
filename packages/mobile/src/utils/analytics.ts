import { Platform } from 'react-native'
import analytics from '@segment/analytics-react-native'
import VersionNumber from 'react-native-version-number'
import Config from 'react-native-config'
import { Identify, Track, Screen, AllEvents } from '../types/analytics'

let analyticsSetupStatus: 'ready' | 'pending' | 'error' = 'pending'

const SegmentWriteKey =
  Platform.OS === 'android'
    ? Config.SEGMENT_ANDROID_WRITE_KEY
    : Config.SEGMENT_IOS_WRITE_KEY

export const setup = async () => {
  try {
    console.info('Analytics setup')
    await analytics.setup(SegmentWriteKey, {
      // Record screen views automatically!
      recordScreenViews: false,
      // Record certain application events automatically!
      trackAppLifecycleEvents: true,
      // Always flush events (worse for battery, but the web-view is likely even worse)
      // https://segment.com/docs/connections/sources/catalog/libraries/mobile/react-native/#flush
      flushAt: 1
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
  const version = VersionNumber.appVersion
  const propertiesWithContext = {
    ...properties,
    mobileClientVersion: version
  }
  console.info('Analytics track', eventName, propertiesWithContext)
  analytics.track(eventName, propertiesWithContext)
}

// Screen Event
// Docs: https://segment.com/docs/connections/sources/catalog/libraries/mobile/react-native/#screen
export const screen = async ({ route, properties }: Screen) => {
  const isSetup = await isAudiusSetup()
  if (!isSetup) return
  console.info('Analytics screen', route, properties)
  analytics.screen(route, properties)
}
