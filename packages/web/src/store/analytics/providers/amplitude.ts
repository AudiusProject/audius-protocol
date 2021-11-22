// Amplitude Analytics
import { Name } from 'common/models/Analytics'
import { Nullable } from 'common/utils/typeUtils'

import { getSource } from './segment'

const AMP_API_KEY = process.env.REACT_APP_AMPLITUDE_API_KEY
const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const IS_PRODUCTION_BUILD = process.env.NODE_ENV === 'production'

const TRACK_LIMIT = 10000
const AMPLITUDE_PROXY = 'metrics.audius.co'

/**
 * ========================= Amplitude Analytics =========================
 * Description:
 *  The Ampltude library
 *
 * Link for more info: https://amplitude.github.io/Amplitude-JavaScript/
 */
let amp: Nullable<any> = null
export const init = async () => {
  try {
    if (!amp && AMP_API_KEY) {
      const amplitude = await import('amplitude-js')
      amplitude
        .getInstance()
        .init(AMP_API_KEY, undefined, { apiEndpoint: AMPLITUDE_PROXY })
      amp = amplitude
      const source = getSource()
      amp.track(Name.SESSION_START, { source })
    }
  } catch (err) {
    console.error(err)
  }
}

// Identify User
// Docs: https://developers.amplitude.com/docs/javascript#setting-user-id
export const identify = (
  handle: string,
  traits?: Record<string, any>,
  callback?: () => void
) => {
  if (!amp) {
    if (callback) callback()
    return
  }
  amp.getInstance().setUserId(handle)
  if (traits && Object.keys(traits).length > 0) {
    amp.getInstance().setUserProperties(traits)
  }
  if (callback) callback()
}

// Track Event
// Docs: https://developers.amplitude.com/docs/javascript#sending-events
export const track = (
  event: string,
  properties?: Record<string, any>,
  callback?: () => void
) => {
  if (!amp) {
    if (callback) callback()
    return
  }
  amp.getInstance().logEvent(event, properties)
  if (callback) callback()
}
