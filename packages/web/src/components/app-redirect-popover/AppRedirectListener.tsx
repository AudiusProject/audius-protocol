import { useEffect } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Dispatch } from 'redux'

import { MobileOS } from 'models/OS'
import { getMobileOS } from 'utils/clientUtil'
import { APP_REDIRECT } from 'utils/route'

type AppRedirectListenerProps = ReturnType<typeof mapDispatchToProps>

const EMBED_HASH = '#embed'
const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const IOS_APP_STORE_LINK = 'itms-apps://us/app/audius-music/id1491270519'
const ANDROID_PLAY_STORE_LINK =
  'https://play.google.com/store/apps/details?id=co.audius.app'
const IOS_WEBSITE_STORE_LINK =
  'https://apps.apple.com/us/app/audius-music/id1491270519'

/**
 * `AppRedirectListener` listens to redirects from the `AppRedirectPopover`.
 * - If we're in the mobile app, it redirects us to the desired page.
 * - If we're on mobile web, and the `#embed` hash exists, we reload the page into a version with no
 *   `redirect.` hostname nor /app-redirect path. These are links from the embed player.
 * - If we're on mobile web, and the `embed` query param does not exist, it redirects to an appstore download
 *   page. These correspond to links from the AppRedirectPopover.
 */
const AppRedirectListener = ({ goToRoute }: AppRedirectListenerProps) => {
  const { pathname } = useLocation()

  useEffect(() => {
    // If we're not in the redirect route, abort.
    if (pathname.search(APP_REDIRECT) === -1) return

    // Check if we're coming from embed player.
    const hash = window.location.hash
    if (hash === EMBED_HASH) {
      // split off `redirect portion of URL`
      let hostname = window.location.hostname
      hostname = hostname.replace('redirect.', '')
      // split off `/app-redirect/` path component
      // don't include hash
      const path = pathname.replace(APP_REDIRECT, '')
      const newURL = `https://${hostname}${path}`
      window.location.href = newURL
      return
    }

    if (!NATIVE_MOBILE) {
      const os = getMobileOS()
      if (os === MobileOS.IOS) {
        window.location.href = IOS_APP_STORE_LINK
      } else if (os === MobileOS.ANDROID) {
        window.location.href = ANDROID_PLAY_STORE_LINK
      } else {
        window.location.href = IOS_WEBSITE_STORE_LINK
      }
    }
  }, [pathname, goToRoute])

  return null
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(() => {}, mapDispatchToProps)(AppRedirectListener)
