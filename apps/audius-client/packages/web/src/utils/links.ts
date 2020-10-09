// TODO: Move to route.js
import { MouseEvent } from 'react'
// External Links
export const AUDIUS_TWITTER_LINK = 'https://twitter.com/AudiusProject'
export const AUDIUS_INSTAMGRAM_LINK = 'https://www.instagram.com/audiusmusic'
export const AUDIUS_DISCORD_LINK = 'https://discord.gg/yNUg2e2'

// Org Links
export const AUDIUS_ORG = 'https://audius.org'
export const AUDIUS_TEAM_LINK = 'https://audius.org/team'
export const AUDIUS_DEV_STAKER_LINK = 'https://audius.org/developers'

export const AUDIUS_HOME_LINK = '/'
export const AUDIUS_LISTENING_LINK = '/trending'
export const AUDIUS_SIGN_UP_LINK = '/signup'
export const AUDIUS_PRESS_LINK = '/press'
export const AUDIUS_HOT_AND_NEW =
  '/audius/playlist/hot-new-on-audius-%F0%9F%94%A5-4281'
export const AUDIUS_EXPLORE_LINK = '/explore'

// TODO: de-dupe from links in route.js
export const AUDIUS_PRIVACY_POLICY_LINK = '/legal/privacy-policy'
export const AUDIUS_TERMS_OF_USE_LINK = '/legal/terms-of-use'
export const AUDIUS_CAREERS_LINK = 'https://jobs.lever.co/audius'

export const AUDIUS_PODCAST_LINK =
  'https://www.youtube.com/playlist?list=PLKEECkHRxmPag5iYp4dTK5fGoRcoX40RY'
export const AUDIUS_CYPHER_LINK = 'https://discord.gg/yNUg2e2'

export const AUDIUS_PRESS_KIT_ZIP =
  'https://s3-us-west-1.amazonaws.com/download.audius.co/Audius+Press+Kit+2.0.zip'

export const pushWindowRoute = (route: string) => {
  if (route === AUDIUS_SIGN_UP_LINK) {
    recordGoToSignup(() => {
      window.location.href = route
    })
  } else {
    window.location.href = route
  }
}

export const handleClickRoute = (route: string) => (e: MouseEvent) => {
  e.preventDefault()
  pushWindowRoute(route)
}

export const recordGoToSignup = (callback: () => void) => {
  if ((window as any).analytics) {
    ;(window as any).analytics.track(
      'Create Account: Open',
      { source: 'landing page' },
      null,
      callback
    )
  } else {
    callback()
  }
}
