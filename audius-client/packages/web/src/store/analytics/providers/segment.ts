// Segment Analytics
import {
  SetAnalyticsUser,
  TrackAnalyticsEvent
} from 'services/native-mobile-interface/analytics'
import { version } from '../../../../package.json'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

/**
 * ========================= Segment Analytics =========================
 * Description:
 *  The Segment library attaches to the global window namespace as `analytics`
 *
 * Link for more info: https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/
 */

// Identify User
// Docs: https://segment.com/docs/connections/spec/identify
export const identify = (
  handle: string,
  traits?: Record<string, any>,
  options?: Record<string, any>,
  callback?: () => void
) => {
  if (NATIVE_MOBILE) {
    const message = new SetAnalyticsUser(handle, traits)
    message.send()
  } else {
    if (!(window as any).analytics) {
      if (callback) callback()
      return
    }
    ;(window as any).analytics.identify(handle, traits, options, callback)
  }
}

// Track Event
// Docs: https://segment.com/docs/connections/spec/track/
export const track = (
  event: string,
  properties?: Record<string, any>,
  options?: Record<string, any>,
  callback?: () => void
) => {
  // Add generic track event context for every event
  const propertiesWithContext = {
    ...properties,
    clientVersion: version
  }

  if (NATIVE_MOBILE) {
    const message = new TrackAnalyticsEvent(event, propertiesWithContext)
    message.send()
  } else {
    if (!(window as any).analytics) {
      if (callback) callback()
      return
    }
    ;(window as any).analytics.track(
      event,
      propertiesWithContext,
      options,
      callback
    )
  }
}
