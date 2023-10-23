import { Name, MobileOS } from '@audius/common'

import {
  isMobile as getIsMobile,
  isElectron as getIsElectron,
  getMobileOS
} from 'utils/clientUtil'
// Segment Analytics

export const getSource = () => {
  const mobileOS = getMobileOS()
  const isMobile = getIsMobile()
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

const getSegmentWriteKey = () => {
  const isMobile = getIsMobile()
  const isElectron = getIsElectron()
  if (isMobile) {
    return import.meta.env.VITE_SEGMENT_MOBILE
  } else if (isElectron) {
    return import.meta.env.VITE_SEGMENT_ELECTRON
  }
  return import.meta.env.VITE_SEGMENT_WEB
}
const SEGMENT_KEY = getSegmentWriteKey()
const segmentScript = `!function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on"];analytics.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);analytics.push(e);return analytics}};for(var t=0;t<analytics.methods.length;t++){var e=analytics.methods[t];analytics[e]=analytics.factory(e)}analytics.load=function(t,e){var n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src="https://analytics.audius.co/"+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(n,a);analytics._loadOptions=e};analytics.SNIPPET_VERSION="4.1.0";}}();`

export const init = async () => {
  try {
    const script = document.createElement('script')
    script.innerHTML = segmentScript
    document.head.appendChild(script)
    const source = getSource()
    ;(window as any).analytics.load(SEGMENT_KEY)
    ;(window as any).analytics.track(Name.SESSION_START, { source })
  } catch (err) {
    console.error(err)
  }
}

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
  if (!(window as any).analytics) {
    if (callback) callback()
    return
  }
  ;(window as any).analytics.identify(handle, traits, options, callback)
}

// Track Event
// Docs: https://segment.com/docs/connections/spec/track/
export const track = (
  event: string,
  properties?: Record<string, any>,
  options?: Record<string, any>,
  callback?: () => void
) => {
  if (!(window as any).analytics) {
    if (callback) callback()
    return
  }
  ;(window as any).analytics.track(event, properties, options, callback)
}
