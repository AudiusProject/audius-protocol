import { lazy, Suspense, useState, useCallback, useEffect } from 'react'

import { BrowserRouter as Router, Route } from 'react-router-dom'

import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'
import NavScreen from 'public-site/components/NavOverlay'
import {
  TRENDING_PAGE,
  SIGN_UP_PAGE,
  UPLOAD_PAGE,
  EXPLORE_PAGE,
  AUDIUS_PRESS_LINK
} from 'utils/route'

import { AppContextProvider } from '../app/AppContextProvider'

import LandingPage from './pages/landing-page/LandingPage'

const BASENAME = process.env.VITE_PUBLIC_URL

const PrivacyPolicyPage = lazy(
  () => import('./pages/privacy-policy-page/PrivacyPolicyPage')
)
const DownloadPage = lazy(() => import('./pages/download-page/DownloadPage'))
const TermsOfUsePage = lazy(
  () => import('./pages/terms-of-use-page/TermsOfUsePage')
)

const ROOT_ID = 'root'
const SCROLL_LOCK_CLASS = 'scrollLock'
const MOBILE_MAX_WIDTH = 800
const MOBILE_WIDTH_MEDIA_QUERY = window.matchMedia(
  `(max-width: ${MOBILE_MAX_WIDTH}px)`
)

type PublicSiteProps = {
  isMobile: boolean
  setRenderPublicSite: (shouldRender: boolean) => void
}

export const PublicSite = (props: PublicSiteProps) => {
  const { isMobile, setRenderPublicSite } = props
  const [isMobileOrNarrow, setIsMobileOrNarrow] = useState(isMobile)
  const handleMobileMediaQuery = useCallback(() => {
    if (MOBILE_WIDTH_MEDIA_QUERY.matches) setIsMobileOrNarrow(true)
    else setIsMobileOrNarrow(isMobile)
  }, [isMobile])

  useEffect(() => {
    handleMobileMediaQuery()
    MOBILE_WIDTH_MEDIA_QUERY.addListener(handleMobileMediaQuery)
    return () => MOBILE_WIDTH_MEDIA_QUERY.removeListener(handleMobileMediaQuery)
  }, [handleMobileMediaQuery])

  const [isNavScreenOpen, setIsNavScreenOpen] = useState(false)

  const closeNavScreen = useCallback(() => {
    const el = document.getElementById(ROOT_ID)
    if (!el) return
    el.classList.remove(SCROLL_LOCK_CLASS)
    const scrollTop = parseInt(el.style.top || '', 10) || 0
    el.style.removeProperty('top')
    window.scrollTo({ top: -1 * scrollTop })
    setIsNavScreenOpen(false)
  }, [setIsNavScreenOpen])

  const openNavScreen = useCallback(() => {
    const el = document.getElementById(ROOT_ID)
    if (!el) return
    el.style.top = `-${window.pageYOffset}px`
    el.classList.add(SCROLL_LOCK_CLASS)
    setIsNavScreenOpen(true)
  }, [setIsNavScreenOpen])

  return (
    <>
      <div style={{ display: 'none' }}>
        <h1>Audius</h1>
        <h2>
          <a href={TRENDING_PAGE}>Trending</a>
        </h2>
        <h2>
          <a href={EXPLORE_PAGE}>Explore</a>
        </h2>
        <h2>
          <a href={SIGN_UP_PAGE}>Sign Up</a>
        </h2>
        <h2>
          <a href={UPLOAD_PAGE}>Upload</a>
        </h2>
      </div>

      <Suspense fallback={<div style={{ width: '100vw', height: '100vh' }} />}>
        <AppContextProvider>
          <Router basename={BASENAME}>
            <NavScreen
              closeNavScreen={closeNavScreen}
              isOpen={isNavScreenOpen}
              setRenderPublicSite={setRenderPublicSite}
            />
            <Route
              exact
              path={'/legal/terms-of-use'}
              render={() => (
                <TermsOfUsePage
                  isMobile={isMobileOrNarrow}
                  openNavScreen={openNavScreen}
                  setRenderPublicSite={setRenderPublicSite}
                />
              )}
            />
            <Route
              exact
              path={'/legal/privacy-policy'}
              render={() => (
                <PrivacyPolicyPage
                  isMobile={isMobileOrNarrow}
                  openNavScreen={openNavScreen}
                  setRenderPublicSite={setRenderPublicSite}
                />
              )}
            />
            <Route
              exact
              path={'/press'}
              render={() => {
                window.location.href = AUDIUS_PRESS_LINK
                return null
              }}
            />
            <Route
              exact
              path={'/download'}
              render={() => (
                <DownloadPage
                  isMobile={isMobileOrNarrow}
                  openNavScreen={openNavScreen}
                  setRenderPublicSite={setRenderPublicSite}
                />
              )}
            />
            <Route
              exact
              path={'/'}
              render={() => (
                <LandingPage
                  isMobile={isMobileOrNarrow}
                  openNavScreen={openNavScreen}
                  setRenderPublicSite={setRenderPublicSite}
                />
              )}
            />
            <Route
              exact
              path={'/auth-redirect'}
              render={() => <LoadingSpinnerFullPage />}
            />
          </Router>
        </AppContextProvider>
      </Suspense>
    </>
  )
}
