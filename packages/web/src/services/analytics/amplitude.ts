import * as amplitude from '@amplitude/analytics-browser'
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser'
import { Name, MobileOS } from '@audius/common/models'

import { env } from 'services/env'
import { isElectron as getIsElectron, getMobileOS } from 'utils/clientUtil'

const AMP_API_KEY = env.AMPLITUDE_API_KEY
const AMPLITUDE_PROXY = env.AMPLITUDE_PROXY

const isAmplitudeConfigured = !!AMP_API_KEY && !!AMPLITUDE_PROXY

// Create and Install Session Replay Plugin
const sessionReplayTracking = sessionReplayPlugin()

/**
 * ========================= Amplitude Analytics =========================
 * Description:
 *  The Amplitude library using V2 API
 */
export const init = async (isMobile: boolean) => {
  try {
    if (isAmplitudeConfigured) {
      amplitude.init(AMP_API_KEY, {
        serverUrl: AMPLITUDE_PROXY,
        defaultTracking: {
          sessions: true
        }
      })
      amplitude.add(sessionReplayTracking)

      const source = getSource(isMobile)
      amplitude.track(Name.SESSION_START, { source })
    }
  } catch (err) {
    console.error(err)
  }
}

// Identify User
export const identify = (
  handle: string,
  traits?: Record<string, any>,
  callback?: () => void
) => {
  if (!isAmplitudeConfigured) {
    if (callback) callback()
    return
  }
  amplitude.setUserId(handle)
  if (traits && Object.keys(traits).length > 0) {
    const identifyObj = new amplitude.Identify()
    Object.entries(traits).map(([k, v]) => identifyObj.add(k, v))
    amplitude.identify(identifyObj)
  }
  if (callback) callback()
}

// Track Event
export const track = (
  event: string,
  properties?: Record<string, any>,
  callback?: () => void
) => {
  if (!isAmplitudeConfigured) {
    if (callback) callback()
    return
  }
  amplitude.track(event, properties)
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
