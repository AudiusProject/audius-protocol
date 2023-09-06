import { Suspense, useState, useEffect, lazy } from 'react'

import { useAsync } from 'react-use'

import { localStorage } from 'services/local-storage'
import { useIsMobile, isElectron } from 'utils/clientUtil'
import { getPathname, HOME_PAGE, publicSiteRoutes } from 'utils/route'

import Dapp from './app'

const PublicSite = lazy(() => import('./pages/PublicSite'))

const isPublicSiteRoute = (location = window.location) => {
  const pathname = getPathname(location).toLowerCase()
  return [...publicSiteRoutes, HOME_PAGE].includes(pathname)
}

const isPublicSiteSubRoute = (location = window.location) => {
  const pathname = getPathname(location).toLowerCase()
  return publicSiteRoutes.includes(pathname)
}

const clientIsElectron = isElectron()

const Root = () => {
  const [renderPublicSite, setRenderPublicSite] = useState(isPublicSiteRoute())
  const isMobileClient = useIsMobile()

  const { value: foundUser } = useAsync(() =>
    localStorage.getCurrentUserExists()
  )

  useEffect(() => {
    // TODO: listen to history and change routes based on history...
    window.onpopstate = () => {
      setRenderPublicSite(isPublicSiteRoute())
    }
  }, [])

  const shouldRedirectToApp = foundUser && !isPublicSiteSubRoute()
  if (renderPublicSite && !clientIsElectron && !shouldRedirectToApp) {
    return (
      <Suspense fallback={<div style={{ width: '100vw', height: '100vh' }} />}>
        <PublicSite
          isMobile={isMobileClient}
          setRenderPublicSite={setRenderPublicSite}
        />
      </Suspense>
    )
  }

  return (
    <>
      <Dapp />
    </>
  )
}

export default Root
