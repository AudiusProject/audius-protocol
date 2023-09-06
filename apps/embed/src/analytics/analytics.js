import amplitude from 'amplitude-js'

import { getAmplitudeAPIKey, getAmplitudeProxy } from '../util/getEnv'
import { logError } from '../util/logError'

const AMP_API_KEY = getAmplitudeAPIKey()
const AMP_PROXY = getAmplitudeProxy()

const amp = amplitude.getInstance()

export const initTrackSessionStart = async () => {
  try {
    if (AMP_API_KEY && AMP_PROXY) {
      const SESSION_START = 'Session Start'
      const SOURCE = 'embed player'
      amp.init(AMP_API_KEY, undefined, { apiEndpoint: AMP_PROXY })
      amp.logEvent(SESSION_START, {
        source: SOURCE,
        referrer: document.referrer
      })
    }
  } catch (err) {
    logError(err)
  }
}

const SOURCE = 'embed player'

const OPEN = 'Embed: Open Player'
const ERROR = 'Embed: Player Error'
const PLAYBACK_PLAY = 'Playback: Play'
const PLAYBACK_PAUSE = 'Playback: Pause'
const LISTEN = 'Listen'

const track = (event, properties) => {
  if (amp) {
    amp.logEvent(event, properties)
  }
}

/** id param is the numeric id */
export const recordOpen = (id, title, handle, path) => {
  track(OPEN, { id: `${id}`, handle, title, path, referrer: document.referrer })
}

export const recordError = () => {
  track(ERROR, { referrer: document.referrer })
}

/** id param is the numeric id */
export const recordPlay = (id) => {
  track(PLAYBACK_PLAY, {
    id: `${id}`,
    source: SOURCE,
    referrer: document.referrer
  })
}

/** id param is the numeric id */
export const recordPause = (id) => {
  track(PLAYBACK_PAUSE, {
    id: `${id}`,
    source: SOURCE,
    referrer: document.referrer
  })
}

/** id param is the numeric id */
export const recordListen = (id) => {
  track(LISTEN, { id: `${id}` })
}
