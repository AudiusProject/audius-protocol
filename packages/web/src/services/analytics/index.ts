import {
  AnalyticsEvent,
  Nullable,
  BooleanKeys,
  AllTrackingEvents
} from '@audius/common'

import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

import packageInfo from '../../../package.json'

import * as amplitude from './amplitude'
import * as segment from './segment'
const { version } = packageInfo

const IS_PRODUCTION_BUILD = process.env.VITE_ENVIRONMENT === 'production'

let resolveCallback: Nullable<(value?: any) => void> = null
let rejectCallback: Nullable<(value?: any) => void> = null
const didInit = new Promise((resolve, reject) => {
  resolveCallback = resolve
  rejectCallback = reject
})

export const init = async () => {
  try {
    await remoteConfigInstance.waitForRemoteConfig()
    const useAmplitude = remoteConfigInstance.getRemoteVar(
      BooleanKeys.USE_AMPLITUDE
    )
    if (useAmplitude) {
      await amplitude.init()
    } else {
      await segment.init()
    }
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
    const useAmplitude = remoteConfigInstance.getRemoteVar(
      BooleanKeys.USE_AMPLITUDE
    )

    if (!IS_PRODUCTION_BUILD) {
      console.info(
        `${useAmplitude ? 'Amplitude' : 'Segment'} | track`,
        eventName,
        properties
      )
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
    if (useAmplitude)
      return amplitude.track(eventName, propertiesWithContext, callback)
    return segment.track(eventName, propertiesWithContext, {}, callback)
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
    const useAmplitude = remoteConfigInstance.getRemoteVar(
      BooleanKeys.USE_AMPLITUDE
    )

    if (!IS_PRODUCTION_BUILD) {
      console.info(
        `${useAmplitude ? 'Amplitude' : 'Segment'} | identify`,
        handle,
        traits,
        options
      )
    }

    await didInit
    if (useAmplitude) return amplitude.identify(handle, traits, callback)
    return segment.identify(handle, traits, options, callback)
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
