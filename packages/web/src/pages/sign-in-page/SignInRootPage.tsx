import { signInPageMessages } from '@audius/common/messages'
import { route } from '@audius/common/utils'
import { Helmet } from 'react-helmet'
import { useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useFirstMountState } from 'react-use'

import { getIsGuest } from 'common/store/pages/signon/selectors'

import { ConfirmEmailPage } from './ConfirmEmailPage'
import { SignInPage } from './SignInPage'

const { SIGN_IN_PAGE, SIGN_IN_CONFIRM_EMAIL_PAGE } = route

export const SignInRootPage = () => {
  // Redirect users from confirm-email page on first mount
  const isFirstMount = useFirstMountState()
  const isGuest = useSelector(getIsGuest)

  return (
    <>
      <Helmet>
        <title>{signInPageMessages.metaTitle}</title>
        <meta name='description' content={signInPageMessages.metaDescription} />
      </Helmet>
      <Routes>
        <Route path={SIGN_IN_PAGE} element={<SignInPage />} />
        {isGuest ? (
          <Route
            path={SIGN_IN_CONFIRM_EMAIL_PAGE}
            element={<ConfirmEmailPage />}
          />
        ) : isFirstMount ? (
          <Route
            path={SIGN_IN_CONFIRM_EMAIL_PAGE}
            element={<Navigate to={SIGN_IN_PAGE} />}
          />
        ) : (
          <Route
            path={SIGN_IN_CONFIRM_EMAIL_PAGE}
            element={<ConfirmEmailPage />}
          />
        )}
      </Routes>
    </>
  )
}
