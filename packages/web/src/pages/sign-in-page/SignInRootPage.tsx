import { signInPageMessages } from '@audius/common/messages'
import { accountSelectors } from '@audius/common/src/store/account'
import { route } from '@audius/common/utils'
import { Helmet } from 'react-helmet'
import { useSelector } from 'react-redux'
import { Redirect, Route, Switch } from 'react-router-dom'
import { useFirstMountState } from 'react-use'

import { SIGN_UP } from 'common/store/pages/signon/actions'
import { getEmailField, getIsGuest } from 'common/store/pages/signon/selectors'
import { CreatePasswordPage } from 'pages/sign-up-page/pages/CreatePasswordPage'

import { ConfirmEmailPage } from './ConfirmEmailPage'
import { SignInPage } from './SignInPage'

const { getGuestEmail } = accountSelectors

const { SIGN_IN_PAGE, SIGN_IN_CONFIRM_EMAIL_PAGE, SIGN_UP_PASSWORD_PAGE } =
  route

export const SignInRootPage = () => {
  // Redirect users from confirm-email page on first mount
  const isFirstMount = useFirstMountState()
  const currentAccountEmail = useSelector(getGuestEmail)
  const { value: emailFromSignOn } = useSelector(getEmailField)
  const isGuest = useSelector(getIsGuest)
  console.log(
    'asdf isguest',
    isGuest && currentAccountEmail === emailFromSignOn
  )
  return (
    <>
      <Helmet>
        <title>{signInPageMessages.metaTitle}</title>
        <meta name='description' content={signInPageMessages.metaDescription} />
      </Helmet>
      <Switch>
        <Route exact path={SIGN_IN_PAGE}>
          <SignInPage />
        </Route>
        {isGuest && currentAccountEmail === emailFromSignOn ? (
          <Redirect to={SIGN_UP_PASSWORD_PAGE} />
        ) : isGuest && currentAccountEmail !== emailFromSignOn ? (
          <Route exact path={SIGN_IN_CONFIRM_EMAIL_PAGE}>
            <ConfirmEmailPage />
          </Route>
        ) : isFirstMount ? (
          <Redirect to={SIGN_IN_PAGE} />
        ) : (
          <Route exact path={SIGN_IN_CONFIRM_EMAIL_PAGE}>
            <ConfirmEmailPage />
          </Route>
        )}
      </Switch>
    </>
  )
}
