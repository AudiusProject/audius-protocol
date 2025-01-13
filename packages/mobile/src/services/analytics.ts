import {
  init as amplitudeInit,
  track as amplitudeTrack,
  setUserId,
  identify as amplitudeIdentify,
  flush,
  Identify
} from '@amplitude/analytics-react-native'
import VersionNumber from 'react-native-version-number'

import { env } from 'app/env'
import { versionInfo } from 'app/utils/appVersionWithCodepush'

import packageInfo from '../../package.json'
import type { Track, Screen, AllEvents } from '../types/analytics'
import { EventNames } from '../types/analytics'

const { version: clientVersion } = packageInfo

let analyticsSetupStatus: 'ready' | 'pending' | 'error' = 'pending'

const AmplitudeWriteKey = env.AMPLITUDE_API_KEY
const AmplitudeProxy = env.AMPLITUDE_PROXY
const IS_PRODUCTION_BUILD = process.env.NODE_ENV === 'production'

export const init = async () => {
  try {
    if (AmplitudeWriteKey && AmplitudeProxy) {
      await amplitudeInit(AmplitudeWriteKey, undefined, {
        serverUrl: AmplitudeProxy
      })
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
export const identify = async (
  handle: string,
  traits: Record<string, any> = {}
) => {
  const isSetup = await isAudiusSetup()
  if (!isSetup) return

  setUserId(handle)
  const identifyObj = new Identify()
  Object.entries(traits).forEach(([key, value]) => {
    identifyObj.set(key, value)
  })
  await amplitudeIdentify(identifyObj)
}

// Track Event
export const track = async ({ eventName, properties }: Track) => {
  const isSetup = await isAudiusSetup()
  if (!isSetup) return
  const version = VersionNumber.appVersion
  const propertiesWithContext = {
    ...properties,
    clientVersion,
    isNativeMobile: true,
    mobileClientVersion: version,
    mobileClientVersionInclOTA: versionInfo ?? 'unknown'
  }
  if (!IS_PRODUCTION_BUILD) {
    console.info('Amplitude | track', eventName, properties)
  }
  await amplitudeTrack(eventName, propertiesWithContext)
}

// Screen Event
export const screen = async ({ route, properties = {} }: Screen) => {
  const isSetup = await isAudiusSetup()
  if (!isSetup) return
  console.log({ isSetup })
  await amplitudeTrack(EventNames.PAGE_VIEW, { route, ...properties })
}

// Force upload events
export const uploadEvents = async () => {
  const isSetup = await isAudiusSetup()
  if (!isSetup) return
  await flush()
}
