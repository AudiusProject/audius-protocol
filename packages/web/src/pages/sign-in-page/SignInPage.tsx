import { useCallback } from 'react'

import { Box, IconCloseAlt, useTheme } from '@audius/harmony'
import { Formik } from 'formik'
import { useDispatch } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'

import { signIn } from 'common/store/pages/signon/actions'
import BackgroundWaves from 'components/background-animations/BackgroundWaves'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import Page from 'components/page/Page'
import { useMedia } from 'hooks/useMedia'
import { BASE_URL, SIGN_IN_PAGE, TRENDING_PAGE } from 'utils/route'

import { SignInPageDesktop } from './SignInPageDesktop'
import { SignInPageMobile } from './SignInPageMobile'

const messages = {
  title: 'Sign In',
  description: 'Sign into your Audius account'
}

type SignInValues = {
  email: string
  password: string
}

const initialValues = {
  email: '',
  password: ''
}

export const SignInPage = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const handleSubmit = useCallback(
    (values: SignInValues) => {
      const { email, password } = values
      dispatch(signIn(email, password))
    },
    [dispatch]
  )

  const { isMobile } = useMedia()
  const { spacing } = useTheme()

  const pageProps = {
    title: messages.title,
    description: messages.description,
    canonicalUrl: `${BASE_URL}/${SIGN_IN_PAGE}`
  }

  if (isMobile) {
    return (
      <MobilePageContainer {...pageProps} fullHeight>
        <SignInPageMobile />
      </MobilePageContainer>
    )
  }

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {isMobile ? (
        <MobilePageContainer {...pageProps} fullHeight>
          <SignInPageMobile />
        </MobilePageContainer>
      ) : (
        <Page>
          <BackgroundWaves />
          <Link to={TRENDING_PAGE}>
            <IconCloseAlt
              color='staticWhite'
              css={{
                position: 'absolute',
                left: spacing['2xl'],
                top: spacing['2xl'],
                zIndex: 1
              }}
              onClick={history.goBack}
            />
          </Link>
          <Box css={{ zIndex: 1 }}>
            <SignInPageDesktop />
          </Box>
        </Page>
      )}
    </Formik>
  )
}
