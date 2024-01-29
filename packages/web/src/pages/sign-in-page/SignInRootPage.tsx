import { Helmet } from 'react-helmet'
import { Redirect, Route, Switch } from 'react-router-dom'
import { useFirstMountState } from 'react-use'

import { SIGN_IN_PAGE, SIGN_IN_CONFIRM_EMAIL_PAGE } from 'utils/route'

import { ConfirmEmailPage } from './ConfirmEmailPage'
import { SignInPage } from './SignInPage'
import { signInPageMessages } from '@audius/common/messages'

export const SignInRootPage = () => {
  // Redirect users from confirm-email page on first mount
  const isFirstMount = useFirstMountState()

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
        {isFirstMount ? (
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
