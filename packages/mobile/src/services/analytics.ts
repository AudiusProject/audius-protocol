import { Amplitude } from '@amplitude/react-native'
import VersionNumber from 'react-native-version-number'

import { env } from 'app/env'
import { versionInfo } from 'app/utils/appVersionWithCodepush'

import packageInfo from '../../package.json'
import type { Track, Screen, AllEvents } from '../types/analytics'
import { EventNames } from '../types/analytics'

const { version: clientVersion } = packageInfo

let analyticsSetupStatus: 'ready' | 'pending' | 'error' = 'pending'

const AmplitudeWriteKey = env.AMPLITUDE_WRITE_KEY
const AmplitudeProxy = env.AMPLITUDE_PROXY
const amplitudeInstance = Amplitude.getInstance()
const IS_PRODUCTION_BUILD = process.env.NODE_ENV === 'production'

export const init = async () => {
  try {
    console.log('asdf AmplitudeWriteKey: ', AmplitudeWriteKey, AmplitudeProxy)
    if (AmplitudeWriteKey && AmplitudeProxy) {
      await amplitudeInstance.setServerUrl(AmplitudeProxy)
      await amplitudeInstance.init(AmplitudeWriteKey)
      analyticsSetupStatus = 'ready'
    } else {
      analyticsSetupStatus = 'error'
      console.error(
        'Analytics unable to setup: missing amplitude write key or proxy url'
      )
    }
  } catch (err) {
    analyticsSetupStatus = 'error'
    console.error(`Amplitude error: ${err}`)
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
export const identify = async (
  handle: string,
  traits: Record<string, any> = {}
) => {
  const isSetup = await isAudiusSetup()
  if (!isSetup) return
  amplitudeInstance.setUserId(handle)
  amplitudeInstance.setUserProperties(traits)
}

// Track Event
// Docs: https://segment.com/docs/connections/spec/track/
export const track = async ({ eventName, properties }: Track) => {
  console.log('asdf track: ', { eventName, properties })
  const isSetup = await isAudiusSetup()
  if (!isSetup) return
  const version = VersionNumber.appVersion
  const propertiesWithContext = {
    ...properties,
    clientVersion,
    mobileClientVersion: version,
    mobileClientVersionInclOTA: versionInfo ?? 'unknown'
  }
  if (!IS_PRODUCTION_BUILD) {
    console.info('Amplitude | track', eventName, properties)
  }
  await amplitudeInstance.logEvent(eventName, propertiesWithContext)
}

// Screen Event
// Docs: https://segment.com/docs/connections/sources/catalog/libraries/mobile/react-native/#screen
export const screen = async ({ route, properties = {} }: Screen) => {
  const isSetup = await isAudiusSetup()
  if (!isSetup) return
  amplitudeInstance.logEvent(EventNames.PAGE_VIEW, { route, ...properties })
}
