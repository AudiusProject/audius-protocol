import { AnalyticsEvent, Nullable, BooleanKeys } from '@audius/common'

import {
  SetAnalyticsUser,
  TrackAnalyticsEvent
} from 'services/native-mobile-interface/analytics'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

import packageInfo from '../../../package.json'

import * as amplitude from './amplitude'
import * as segment from './segment'
const { version } = packageInfo

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const IS_PRODUCTION_BUILD = process.env.NODE_ENV === 'production'

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
    if (NATIVE_MOBILE) {
      const message = new TrackAnalyticsEvent(eventName, propertiesWithContext)
      message.send()
    } else {
      await didInit
      if (useAmplitude)
        return amplitude.track(eventName, propertiesWithContext, callback)
      return segment.track(eventName, propertiesWithContext, {}, callback)
    }
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

    if (NATIVE_MOBILE) {
      const message = new SetAnalyticsUser(handle, traits)
      message.send()
    } else {
      await didInit
      if (useAmplitude) return amplitude.identify(handle, traits, callback)
      return segment.identify(handle, traits, options, callback)
    }
  } catch (err) {
    console.error(err)
  }
}
