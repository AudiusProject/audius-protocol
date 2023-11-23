import { useCallback } from 'react'

import {
  Flex,
  Text,
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
import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import PreloadImage from 'components/preload-image/PreloadImage'
import { useMedia } from 'hooks/useMedia'
import { SIGN_UP_PAGE } from 'utils/route'

import { SignInWithMetaMaskButton } from './SignInWithMetaMaskButton'

const messages = {
  metaTitle: 'Sign In • Audius',
  metaDescription: 'Sign into your Audius account',

  title: 'Sign Into Audius',
  emailLabel: 'Email',
  passwordLabel: 'Password',
  signIn: 'Sign In',
  newToAudius: 'New to Audius?',
  createAccount: 'Create an Account',
  forgotPassword: 'Forgot password?'
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
  const { isMobile } = useMedia()

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
        <Flex
          flex={1}
          direction='column'
          justifyContent='space-between'
          h='100%'
          p='2xl'
          pb={!isMobile ? 'unit14' : undefined}
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
                    maxHeight: '160px',
                    maxWidth: '160px',
                    height: '100%',
                    width: '100%',
                    objectFit: 'contain'
                  }}
                />
              )}
            </Box>
            <Text
              variant='heading'
              size='l'
              tag='h1'
              color='accent'
              css={{ textAlign: isMobile ? 'center' : undefined }}
            >
              {messages.title}
            </Text>
            <Flex direction='column' gap='l'>
              <HarmonyTextField name='email' label={messages.emailLabel} />
              <HarmonyPasswordField
                name='password'
                label={messages.passwordLabel}
              />
            </Flex>
            <Flex direction='column' gap='l' w='100%'>
              <Button iconRight={IconArrowRight} type='submit'>
                {messages.signIn}
              </Button>
              {!isMobile ? <SignInWithMetaMaskButton /> : null}
              <TextLink
                variant='visible'
                textVariant='body'
                css={{ textAlign: isMobile ? 'center' : undefined }}
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
        </Flex>
      </Formik>
    </>
  )
}
