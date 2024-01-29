import { useCallback, useEffect, useState } from 'react'

import {
  signInPageMessages as messages,
  signInErrorMessages,
  signInSchema
} from '@audius/common'
import {
  Flex,
  IconAudiusLogoHorizontalColor,
  Button,
  IconArrowRight,
  TextLink,
  Box
} from '@audius/harmony'
import { Form, Formik, useField } from 'formik'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import { setValueField, signIn } from 'common/store/pages/signon/actions'
import {
  getEmailField,
  getPasswordField,
  getRequiresOtp,
  getStatus
} from 'common/store/pages/signon/selectors'
import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import PreloadImage from 'components/preload-image/PreloadImage'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { ForgotPasswordHelper } from 'pages/sign-on/components/desktop/ForgotPasswordHelper'
import { EmailField } from 'pages/sign-up-page/components/EmailField'
import { Heading, ScrollView } from 'pages/sign-up-page/components/layout'
import { useSelector } from 'utils/reducer'
import { SIGN_IN_CONFIRM_EMAIL_PAGE, SIGN_UP_PAGE } from 'utils/route'

import { SignInWithMetaMaskButton } from './SignInWithMetaMaskButton'

const SignInSchema = toFormikValidationSchema(signInSchema)

type SignInValues = {
  email: string
  password: string
}

export const SignInPage = () => {
  const dispatch = useDispatch()
  const { isMobile } = useMedia()
  const navigate = useNavigateToPage()
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { value: existingEmail } = useSelector(getEmailField)
  const { value: existingPassword } = useSelector(getPasswordField)
  const requiresOtp = useSelector(getRequiresOtp)

  useEffect(() => {
    if (requiresOtp) {
      navigate(SIGN_IN_CONFIRM_EMAIL_PAGE)
      // This unsets the otp error so we can come back to this page
      // if necessary
      dispatch(setValueField('password', existingPassword))
    }
  }, [navigate, requiresOtp, existingPassword, dispatch])

  const initialValues = {
    email: existingEmail ?? '',
    password: existingPassword ?? ''
  }

  const signInStatus = useSelector(getStatus)

  const handleSubmit = useCallback(
    (values: SignInValues) => {
      const { email, password } = values
      dispatch(setValueField('email', email))
      dispatch(setValueField('password', password))
      dispatch(signIn(email, password))
    },
    [dispatch]
  )

  return (
    <>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={SignInSchema}
        validateOnChange={false}
      >
        <ScrollView
          direction='column'
          justifyContent='space-between'
          ph={isMobile ? 'm' : '2xl'}
          pt='unit14'
          pb={isMobile ? '2xl' : 'unit14'}
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
              <EmailField />
              <SignInPasswordField />
            </Flex>
            <Flex direction='column' gap='l' w='100%'>
              <Button
                iconRight={IconArrowRight}
                type='submit'
                isLoading={signInStatus === 'loading'}
                fullWidth
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
            <Button variant='secondary' asChild fullWidth>
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

const SignInPasswordField = () => {
  const signInError = useSelector((state) =>
    getPasswordField(state)?.error.includes('400')
  )
  const [, , { setError }] = useField('password')

  useEffect(() => {
    if (signInError) {
      setError(signInErrorMessages.invalidCredentials)
    }
  }, [setError, signInError])

  return <HarmonyPasswordField name='password' label={messages.passwordLabel} />
}
