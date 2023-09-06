// Amplitude Analytics
import { Name, Nullable } from '@audius/common'

import { getSource } from './segment'

const AMP_API_KEY = process.env.REACT_APP_AMPLITUDE_API_KEY
const AMPLITUDE_PROXY = process.env.REACT_APP_AMPLITUDE_PROXY

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
        // Note: https is prepended to the apiEndpoint url specified
        .init(AMP_API_KEY, undefined, { apiEndpoint: AMPLITUDE_PROXY })
      amp = amplitude
      const source = getSource()
      amp.getInstance().logEvent(Name.SESSION_START, { source })
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
  if (callback) {
    callback()
  }
}
