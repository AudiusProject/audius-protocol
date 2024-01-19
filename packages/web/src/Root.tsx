import '@audius/stems/dist/stems.css'
import '@audius/harmony/dist/harmony.css'

import { Suspense, useState, useEffect, lazy } from 'react'

import { Location } from 'history'
import { useAsync } from 'react-use'

import { useIsMobile } from 'hooks/useIsMobile'
import { localStorage } from 'services/local-storage'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { isElectron } from 'utils/clientUtil'
import { getPathname, HOME_PAGE, publicSiteRoutes } from 'utils/route'

import App from './app'
import {
  HistoryContextProvider,
  useHistoryContext
} from './app/HistoryProvider'

const PublicSite = lazy(() => import('./public-site'))

const isPublicSiteRoute = (location: Location) => {
  const pathname = getPathname(location).toLowerCase()
  return [...publicSiteRoutes, HOME_PAGE].includes(pathname)
}

const isPublicSiteSubRoute = (location: Location) => {
  const pathname = getPathname(location).toLowerCase()
  return publicSiteRoutes.includes(pathname)
}

const clientIsElectron = isElectron()

const AppOrPublicSite = () => {
  const isMobile = useIsMobile()
  const { history } = useHistoryContext()
  const [renderPublicSite, setRenderPublicSite] = useState(
    isPublicSiteRoute(history.location)
  )

  useEffect(() => {
    remoteConfigInstance.init()
  }, [])

  const { value: foundUser } = useAsync(() =>
    localStorage.getCurrentUserExists()
  )

  useEffect(() => {
    // TODO: listen to history and change routes based on history...
    window.onpopstate = () => {
      setRenderPublicSite(isPublicSiteRoute(history.location))
    }
  }, [history.location])

  const shouldRedirectToApp =
    foundUser && !isPublicSiteSubRoute(history.location)
  if (renderPublicSite && !clientIsElectron && !shouldRedirectToApp) {
    return (
      <Suspense fallback={<div style={{ width: '100vw', height: '100vh' }} />}>
        <PublicSite
          isMobile={isMobile}
          setRenderPublicSite={setRenderPublicSite}
        />
      </Suspense>
    )
  }

  return <App />
}

export const Root = () => {
  return (
    <HistoryContextProvider>
      <AppOrPublicSite />
    </HistoryContextProvider>
  )
}
