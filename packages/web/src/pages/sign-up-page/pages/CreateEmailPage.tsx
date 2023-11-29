import { useCallback, useContext } from 'react'

import { AudiusQueryContext, signUpFetch } from '@audius/common'
import {
  Box,
  Button,
  ButtonType,
  Divider,
  Flex,
  IconArrowRight,
  IconAudiusLogoHorizontalColor,
  Text,
  TextLink
} from '@audius/harmony'
import { Form, Formik, FormikHelpers } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import {
  setLinkedSocialOnFirstPage,
  setValueField
} from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import PreloadImage from 'components/preload-image/PreloadImage'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SocialMediaLoginOptions } from 'pages/sign-up-page/components/SocialMediaLoginOptions'
import {
  SIGN_IN_PAGE,
  SIGN_UP_CREATE_LOGIN_DETAILS,
  SIGN_UP_PASSWORD_PAGE,
  SIGN_UP_REVIEW_HANDLE_PAGE
} from 'utils/route'

import { SignUpWithMetaMaskButton } from '../components/SignUpWithMetaMaskButton'
import { emailSchema } from '../utils/emailSchema'

export const messages = {
  title: 'Sign Up For Audius',
  emailLabel: 'Email',
  signUp: 'Sign Up Free',
  haveAccount: 'Already have an account?',
  signIn: 'Sign In',
  subHeader: (
    <>
      Join the revolution in music streaming! <br /> Discover, connect, and
      create on Audius.
    </>
  ),
  socialsDividerText: 'Or, get started with one of your socials',
  unknownError: 'Unknown error occurred.',
  metaMaskNotRecommended: 'Signing up with MetaMask is not recommended.',
  signUpMetamask: 'Sign Up With MetaMask',
  learnMore: 'Learn More'
}

export type SignUpEmailValues = {
  email: string
}

const FormSchema = toFormikValidationSchema(emailSchema)

export const CreateEmailPage = () => {
  const { isMobile } = useMedia()
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const existingEmailValue = useSelector(getEmailField)
  const queryContext = useContext(AudiusQueryContext)

  const initialValues = {
    email: existingEmailValue.value ?? ''
  }

  const handleCompleteSocialMediaLogin = useCallback(
    (result: { requiresReview: boolean; handle: string }) => {
      const { handle, requiresReview } = result
      dispatch(setLinkedSocialOnFirstPage(true))
      dispatch(setValueField('handle', handle))
      navigate(
        requiresReview
          ? SIGN_UP_REVIEW_HANDLE_PAGE
          : SIGN_UP_CREATE_LOGIN_DETAILS
      )
    },
    [dispatch, navigate]
  )

  const handleSubmit = useCallback(
    async (
      values: SignUpEmailValues,
      { setErrors }: FormikHelpers<SignUpEmailValues>
    ) => {
      const { email } = values
      if (queryContext !== null) {
        try {
          // Check identity API for existing emails
          const emailExists = await signUpFetch.isEmailInUse(
            { email },
            queryContext
          )
          // Set the email in the store
          dispatch(setValueField('email', values.email))
          if (emailExists) {
            // Redirect to sign in if the email exists already
            navigate(SIGN_IN_PAGE)
          } else {
            // Move onto the password page
            navigate(SIGN_UP_PASSWORD_PAGE)
          }
        } catch (e) {
          // Unknown error state ¯\_(ツ)_/¯
          setErrors({ email: messages.unknownError })
        }
      }
    },
    [dispatch, navigate, queryContext]
  )

  return (
    <Formik
      validationSchema={FormSchema}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validateOnBlur
      validateOnChange={false}
    >
      {({ isSubmitting }) => (
        <Flex
          as={Form}
          direction='column'
          h='100%'
          w='100%'
          ph={isMobile ? 'l' : '2xl'}
          pv='2xl'
          gap='2xl'
        >
          <Box alignSelf='center'>
            {isMobile ? (
              <IconAudiusLogoHorizontalColor />
            ) : (
              <PreloadImage
                src={audiusLogoColored}
                alt='Audius Colored Logo'
                css={{
                  height: 160,
                  width: 160,
                  objectFit: 'contain'
                }}
              />
            )}
          </Box>
          <Flex direction='column' gap={isMobile ? 's' : 'l'}>
            <Text
              variant='heading'
              size={isMobile ? 'm' : 'l'}
              color='accent'
              tag='h1'
              css={{ textAlign: isMobile ? 'center' : undefined }}
            >
              {messages.title}
            </Text>
            <Text
              color='default'
              size={isMobile ? 'm' : 'l'}
              variant='body'
              tag='h2'
              css={{ textAlign: isMobile ? 'center' : undefined }}
            >
              {messages.subHeader}
            </Text>
          </Flex>
          <Flex direction='column' gap='l'>
            <HarmonyTextField
              name='email'
              autoComplete='email'
              label={messages.emailLabel}
            />
            <Divider>
              <Text variant='body' size={isMobile ? 's' : 'm'} color='subdued'>
                {messages.socialsDividerText}
              </Text>
            </Divider>
            <SocialMediaLoginOptions
              onCompleteSocialMediaLogin={handleCompleteSocialMediaLogin}
            />
          </Flex>
          <Flex direction='column' gap='l'>
            <Button
              variant={ButtonType.PRIMARY}
              type='submit'
              fullWidth
              iconRight={IconArrowRight}
              isLoading={isSubmitting}
            >
              {messages.signUp}
            </Button>

            <Text
              variant='body'
              size={isMobile ? 'm' : 'l'}
              css={{ textAlign: isMobile ? 'center' : undefined }}
            >
              {messages.haveAccount}{' '}
              <TextLink variant='visible' asChild>
                <Link to={SIGN_IN_PAGE}>{messages.signIn}</Link>
              </TextLink>
            </Text>
          </Flex>
          {!isMobile ? (
            <Flex direction='column' gap='s'>
              <SignUpWithMetaMaskButton />
              <Text size='s' variant='body'>
                {messages.metaMaskNotRecommended}{' '}
                <TextLink variant='visible'>{messages.learnMore}</TextLink>
              </Text>
            </Flex>
          ) : null}
        </Flex>
      )}
    </Formik>
  )
}
