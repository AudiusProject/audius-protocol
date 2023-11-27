import '@audius/stems/dist/stems.css'
import '@audius/harmony/dist/harmony.css'

import { Suspense, useState, useEffect, lazy } from 'react'

import { useAsync } from 'react-use'

import { localStorage } from 'services/local-storage'
import { useIsMobile, isElectron } from 'utils/clientUtil'
import { getPathname, HOME_PAGE, publicSiteRoutes } from 'utils/route'

import App from './app'
import { useSsrContext } from './ssr/SsrContext'

// const App = lazy(() => import('./app'))
const PublicSite = lazy(() => import('./public-site'))

const isPublicSiteRoute = (
  location: { pathname: string } = window.location
) => {
  const pathname = getPathname(location).toLowerCase()
  return [...publicSiteRoutes, HOME_PAGE].includes(pathname)
}

const isPublicSiteSubRoute = (
  location: { pathname: string } = window.location
) => {
  const pathname = getPathname(location).toLowerCase()
  return publicSiteRoutes.includes(pathname)
}

const clientIsElectron = isElectron()

export const Root = () => {
  const { path } = useSsrContext()
  const [renderPublicSite, setRenderPublicSite] = useState(
    isPublicSiteRoute({ pathname: path ?? '' })
  )
  const isMobileClient = useIsMobile()

  const { value: foundUser } = useAsync(() =>
    localStorage.getCurrentUserExists()
  )

  useEffect(() => {
    // TODO: listen to history and change routes based on history...
    window.onpopstate = () => {
      setRenderPublicSite(isPublicSiteRoute({ pathname: path ?? '' }))
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
    // <Suspense fallback={<div style={{ width: '100vw', height: '100vh' }} />}>
    <App />
    // </Suspense>
  )
}
