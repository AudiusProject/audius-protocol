// Amplitude Analytics
import { Name, Nullable, MobileOS } from '@audius/common'
import amplitude from 'amplitude-js'

import { env } from 'services/env'
import { isElectron as getIsElectron, getMobileOS } from 'utils/clientUtil'

const AMP_API_KEY = env.AMPLITUDE_API_KEY
const AMPLITUDE_PROXY = env.AMPLITUDE_PROXY

/**
 * ========================= Amplitude Analytics =========================
 * Description:
 *  The Ampltude library
 *
 * Link for more info: https://amplitude.github.io/Amplitude-JavaScript/
 */
let amp: Nullable<any> = null
export const init = async (isMobile: boolean) => {
  try {
    if (!amp && AMP_API_KEY && AMPLITUDE_PROXY) {
      amplitude
        .getInstance()
        // Note: https is prepended to the apiEndpoint url specified
        .init(AMP_API_KEY, undefined, { apiEndpoint: AMPLITUDE_PROXY })
      amp = amplitude
      const source = getSource(isMobile)
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

export const getSource = (isMobile: boolean) => {
  const mobileOS = getMobileOS()
  const isElectron = getIsElectron()
  if (isMobile) {
    if (mobileOS === MobileOS.ANDROID) {
      return 'Android Web'
    } else if (mobileOS === MobileOS.IOS) {
      return 'iOS Web'
    } else if (mobileOS === MobileOS.WINDOWS_PHONE) {
      return 'iOS Web'
    }
    return 'Unknown Mobile Web'
  } else if (isElectron) {
    const platform = window.navigator.platform
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
    if (macosPlatforms.indexOf(platform) !== -1) {
      return 'MacOS'
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      return 'Windows'
    } else if (/Linux/.test(platform)) {
      return 'Linux'
    }
    return 'Unknown Desktop'
  }
}
