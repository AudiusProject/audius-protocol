import { AnalyticsEvent, Nullable, AllTrackingEvents } from '@audius/common'

import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

import packageInfo from '../../../package.json'

import * as amplitude from './amplitude'
const { version } = packageInfo

const IS_PRODUCTION_BUILD = process.env.VITE_ENVIRONMENT === 'production'

let resolveCallback: Nullable<(value?: any) => void> = null
let rejectCallback: Nullable<(value?: any) => void> = null
const didInit = new Promise((resolve, reject) => {
  resolveCallback = resolve
  rejectCallback = reject
})

export const init = async (isMobile: boolean) => {
  try {
    await remoteConfigInstance.waitForRemoteConfig()
    await amplitude.init(isMobile)
    if (resolveCallback) {
      resolveCallback()
    }
  } catch (err) {
    console.error(err)
    if (rejectCallback) {
      rejectCallback(err)
    }
  }
}

let trackCounter = 0

const TRACK_LIMIT = 10000

export const track = async (
  { eventName, properties }: AnalyticsEvent,
  callback?: () => void
) => {
  try {
    if (!IS_PRODUCTION_BUILD) {
      console.info(`Amplitude | track`, eventName, properties)
    }
    // stop tracking analytics after we reach session limit
    if (trackCounter++ >= TRACK_LIMIT) return

    // Add generic track event context for every event
    const propertiesWithContext = {
      ...properties,
      clientVersion: version
    }

    // TODO: This can be removed when the the web layer is removed from mobile
    await didInit
    return amplitude.track(eventName, propertiesWithContext, callback)
  } catch (err) {
    console.error(err)
  }
}

export const identify = async (
  handle: string,
  traits?: Record<string, any>,
  options?: Record<string, any>,
  callback?: () => void
) => {
  try {
    if (!IS_PRODUCTION_BUILD) {
      console.info('Amplitude | identify', handle, traits, options)
    }

    await didInit
    return amplitude.identify(handle, traits, callback)
  } catch (err) {
    console.error(err)
  }
}

/**
 * NOTE: Do not use as an action creator. This is to be in parity with mobile for sagas in common
 * Use:
 * `import { make } from 'common/store/analytics/actions'`
 * to dispatch actions
 */
export const make = (event: AllTrackingEvents) => {
  const { eventName, ...props } = event
  return {
    eventName,
    properties: props as any
  }
}
