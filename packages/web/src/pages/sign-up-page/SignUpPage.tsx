import { route } from '@audius/common/utils'
import { Helmet } from 'react-helmet'
import { Navigate, Route, Routes } from 'react-router-dom'

import { useDetermineAllowedRoute } from 'pages/sign-up-page/utils/useDetermineAllowedRoutes'

import { CreateEmailPage } from './pages/CreateEmailPage'
import { CreateLoginDetailsPage } from './pages/CreateLoginDetailsPage'
import { CreatePasswordPage } from './pages/CreatePasswordPage'
import { FinishProfilePage } from './pages/FinishProfilePage'
import { LoadingAccountPage } from './pages/LoadingAccountPage'
import { MobileAppCtaPage } from './pages/MobileAppCtaPage'
import { PickHandlePage } from './pages/PickHandlePage'
import { ReviewHandlePage } from './pages/ReviewHandlePage'
import { SelectArtistsPage } from './pages/SelectArtistsPage'
import { SelectGenresPage } from './pages/SelectGenresPage'
import { RouteContextProvider } from './utils/RouteContext'

const {
  FEED_PAGE,
  TRENDING_PAGE,
  SIGN_UP_APP_CTA_PAGE,
  SIGN_UP_ARTISTS_PAGE,
  SIGN_UP_COMPLETED_REDIRECT,
  SIGN_UP_COMPLETED_REFERRER_REDIRECT: SIGN_UP_REFERRER_COMPLETED_REDIRECT,
  SIGN_UP_CREATE_LOGIN_DETAILS,
  SIGN_UP_EMAIL_PAGE,
  SIGN_UP_FINISH_PROFILE_PAGE,
  SIGN_UP_GENRES_PAGE,
  SIGN_UP_HANDLE_PAGE,
  SIGN_UP_LOADING_PAGE,
  SIGN_UP_PAGE,
  SIGN_UP_PASSWORD_PAGE,
  SIGN_UP_REVIEW_HANDLE_PAGE
} = route

const messages = {
  metaTitle: 'Sign Up • Audius',
  metaDescription: 'Create an account on Audius'
}

export const SignUpPage = () => {
  const determineAllowedRoute = useDetermineAllowedRoute()

  const getElement = (Component?: React.ComponentType, path?: string) => {
    const { isAllowedRoute, correctedRoute } = determineAllowedRoute(
      path ?? SIGN_UP_PAGE
    )

    if (!isAllowedRoute) {
      return <Navigate to={correctedRoute} />
    }

    return Component ? <Component /> : null
  }

  return (
    <RouteContextProvider>
      <Helmet>
        <title>{messages.metaTitle}</title>
        <meta name='description' content={messages.metaDescription} />
      </Helmet>
      <Routes>
        <Route
          path={SIGN_UP_PAGE}
          element={getElement(undefined, SIGN_UP_PAGE)}
        />
        <Route
          path={SIGN_UP_EMAIL_PAGE}
          element={getElement(CreateEmailPage, SIGN_UP_EMAIL_PAGE)}
        />
        <Route
          path={SIGN_UP_PASSWORD_PAGE}
          element={getElement(CreatePasswordPage, SIGN_UP_PASSWORD_PAGE)}
        />
        <Route
          path={SIGN_UP_CREATE_LOGIN_DETAILS}
          element={getElement(
            CreateLoginDetailsPage,
            SIGN_UP_CREATE_LOGIN_DETAILS
          )}
        />
        <Route
          path={SIGN_UP_HANDLE_PAGE}
          element={getElement(PickHandlePage, SIGN_UP_HANDLE_PAGE)}
        />
        <Route
          path={SIGN_UP_REVIEW_HANDLE_PAGE}
          element={getElement(ReviewHandlePage, SIGN_UP_REVIEW_HANDLE_PAGE)}
        />
        <Route
          path={SIGN_UP_FINISH_PROFILE_PAGE}
          element={getElement(FinishProfilePage, SIGN_UP_FINISH_PROFILE_PAGE)}
        />
        <Route
          path={SIGN_UP_GENRES_PAGE}
          element={getElement(SelectGenresPage, SIGN_UP_GENRES_PAGE)}
        />
        <Route
          path={SIGN_UP_ARTISTS_PAGE}
          element={getElement(SelectArtistsPage, SIGN_UP_ARTISTS_PAGE)}
        />
        <Route
          path={SIGN_UP_APP_CTA_PAGE}
          element={getElement(MobileAppCtaPage, SIGN_UP_APP_CTA_PAGE)}
        />
        <Route
          path={SIGN_UP_LOADING_PAGE}
          element={getElement(LoadingAccountPage, SIGN_UP_LOADING_PAGE)}
        />
        <Route
          path={SIGN_UP_COMPLETED_REDIRECT}
          element={<Navigate to={FEED_PAGE} />}
        />
        <Route
          path={SIGN_UP_REFERRER_COMPLETED_REDIRECT}
          element={<Navigate to={TRENDING_PAGE} />}
        />
        <Route path='*' element={getElement(undefined, SIGN_UP_PAGE)} />
      </Routes>
    </RouteContextProvider>
  )
}
