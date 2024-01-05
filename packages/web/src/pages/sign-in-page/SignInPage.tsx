import { useCallback, useState } from 'react'

import { signInPageMessages as messages } from '@audius/common'
import {
  Flex,
  IconAudiusLogoHorizontalColor,
  Button,
  IconArrowRight,
  TextLink,
  ButtonType,
  Box
} from '@audius/harmony'
import { Form, Formik } from 'formik'
import { Helmet } from 'react-helmet'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import { signIn } from 'common/store/pages/signon/actions'
import { getEmailField, getStatus } from 'common/store/pages/signon/selectors'
import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import PreloadImage from 'components/preload-image/PreloadImage'
import { useMedia } from 'hooks/useMedia'
import { ForgotPasswordHelper } from 'pages/sign-on/components/desktop/ForgotPasswordHelper'
import { Heading, ScrollView } from 'pages/sign-up-page/components/layout'
import { useSelector } from 'utils/reducer'
import { SIGN_UP_PAGE } from 'utils/route'

import { SignInWithMetaMaskButton } from './SignInWithMetaMaskButton'

type SignInValues = {
  email: string
  password: string
}

export const SignInPage = () => {
  const dispatch = useDispatch()
  const { isMobile } = useMedia()
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const existingEmailValue = useSelector(getEmailField)

  const initialValues = {
    email: existingEmailValue.value ?? '',
    password: ''
  }

  const signInStatus = useSelector(getStatus)

  const handleSubmit = useCallback(
    (values: SignInValues) => {
      const { email, password } = values
      dispatch(signIn(email, password))
    },
    [dispatch]
  )

  return (
    <>
      <Helmet>
        <title>{messages.metaTitle}</title>
        <meta name='description' content={messages.metaDescription} />
      </Helmet>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <ScrollView
          direction='column'
          justifyContent='space-between'
          p='2xl'
          pt='unit20'
          pb={!isMobile ? 'unit14' : undefined}
          gap='l'
        >
          <Flex as={Form} direction='column' gap='2xl'>
            <Box alignSelf='center'>
              {isMobile ? (
                <IconAudiusLogoHorizontalColor />
              ) : (
                <PreloadImage
                  src={audiusLogoColored}
                  alt='Audius Logo'
                  css={{
                    height: 160,
                    width: 160,
                    objectFit: 'contain'
                  }}
                />
              )}
            </Box>
            <Heading heading={messages.title} centered={isMobile} tag='h1' />
            <Flex direction='column' gap='l'>
              <HarmonyTextField name='email' label={messages.emailLabel} />
              <HarmonyPasswordField
                name='password'
                label={messages.passwordLabel}
              />
            </Flex>
            <Flex direction='column' gap='l' w='100%'>
              <Button
                iconRight={IconArrowRight}
                type='submit'
                isLoading={signInStatus === 'loading'}
              >
                {messages.signIn}
              </Button>
              {!isMobile ? <SignInWithMetaMaskButton /> : null}
              <TextLink
                variant='visible'
                textVariant='body'
                css={{ textAlign: isMobile ? 'center' : undefined }}
                onClick={() => {
                  setShowForgotPassword(true)
                }}
              >
                {messages.forgotPassword}
              </TextLink>
            </Flex>
          </Flex>
          {!isMobile ? (
            <Button variant={ButtonType.SECONDARY} asChild>
              <Link to={SIGN_UP_PAGE}>{messages.createAccount}</Link>
            </Button>
          ) : null}
        </ScrollView>
      </Formik>
      <ForgotPasswordHelper
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  )
}
