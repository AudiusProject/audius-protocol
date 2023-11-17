import { useCallback, useContext } from 'react'

import {
  AudiusQueryContext,
  InstagramProfile,
  TikTokProfile,
  TwitterProfile,
  signUpFetch
} from '@audius/common'
import {
  Button,
  ButtonType,
  Divider,
  Flex,
  IconArrowRight,
  Text
} from '@audius/harmony'
import { Form, Formik, FormikHelpers } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import { setValueField } from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { Link } from 'components/link'
import PreloadImage from 'components/preload-image/PreloadImage'
import { ToastContext } from 'components/toast/ToastContext'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { LeftContentContainer } from 'pages/sign-on/components/desktop/LeftContentContainer'
import { PageWithAudiusValues } from 'pages/sign-on/components/desktop/PageWithAudiusValues'
import { EMAIL_REGEX } from 'utils/email'
import { SIGN_IN_PAGE, SIGN_UP_PASSWORD_PAGE } from 'utils/route'

import { SocialMediaLoginOptions } from '../components/SocialMediaLoginOptions'
import {
  useSetProfileFromInstagram,
  useSetProfileFromTikTok,
  useSetProfileFromTwitter
} from '../hooks/socialMediaLogin'
import { messages as socialMediaMessages } from '../utils/socialMediaMessages'

import styles from './SignUpPage.module.css'

const messages = {
  title: 'Sign Up For Audius',
  emailLabel: 'Email',
  signUp: 'Sign Up Free',
  haveAccount: 'Already have an account?',
  signIn: 'Sign In',
  subHeader:
    'Join the revolution in music streaming! Discover, connect, and create on Audius.',
  socialsDividerText: 'Or, get started with one of your socials',
  invalidEmail: 'Please enter a valid email.',
  unknownError: 'Unknown error occurred.',
  ...socialMediaMessages
}

type SignUpEmailValues = {
  email: string
}

const FormSchema = z.object({
  email: z
    .string({ required_error: messages.invalidEmail })
    .regex(EMAIL_REGEX, { message: messages.invalidEmail })
})

export const SignUpPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const queryContext = useContext(AudiusQueryContext)
  const { toast } = useContext(ToastContext)
  const existingEmailValue = useSelector(getEmailField)
  const initialValues = {
    email: existingEmailValue.value ?? ''
  }
  const submitHandler = useCallback(
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

  const handleSocialLoginError = (error: unknown) => {
    console.error(error)
    toast(messages.verificationError)
  }

  const setProfileFromTwitter = useSetProfileFromTwitter()
  const setProfileFromInstagram = useSetProfileFromInstagram()
  const setProfileFromTikTok = useSetProfileFromTikTok()

  const processSocialLoginResult = (result: {
    requiresReview: boolean
    platform: 'twitter' | 'instagram' | 'tiktok'
  }) => {
    toast(messages.socialMediaLoginSucess(result.platform))
    // TODO: Direct to email + pw page
    console.info(result)
  }

  const handleTwitterLogin = async (params: {
    uuid: string
    twitterProfile: TwitterProfile
  }) => {
    let res
    try {
      res = await setProfileFromTwitter(params)
    } catch (e) {
      handleSocialLoginError(e)
      return
    }
    processSocialLoginResult({
      requiresReview: res.requiresReview,
      platform: 'twitter'
    })
  }

  const handleInstagramLogin = async (params: {
    uuid: string
    instagramProfile: InstagramProfile
  }) => {
    let res
    try {
      res = await setProfileFromInstagram(params)
    } catch (e) {
      handleSocialLoginError(e)
      return
    }
    processSocialLoginResult({
      requiresReview: res.requiresReview,
      platform: 'instagram'
    })
  }

  const handleTikTokLogin = async (params: {
    uuid: string
    tikTokProfile: TikTokProfile
  }) => {
    let res
    try {
      res = await setProfileFromTikTok(params)
    } catch (e) {
      handleSocialLoginError(e)
      return
    }
    processSocialLoginResult({
      requiresReview: res.requiresReview,
      platform: 'tiktok'
    })
  }

  return (
    <Flex h='100%' alignItems='center' justifyContent='center'>
      <PageWithAudiusValues>
        <Formik
          validationSchema={toFormikValidationSchema(FormSchema)}
          initialValues={initialValues}
          onSubmit={submitHandler}
          validateOnBlur
          validateOnChange={false}
        >
          {({ isSubmitting }) => (
            <Form>
              <LeftContentContainer gap='2xl' alignItems='center'>
                <PreloadImage
                  src={audiusLogoColored}
                  className={styles.logo}
                  alt='Audius Colored Logo'
                />
                <Flex
                  direction='column'
                  gap='l'
                  alignItems='flex-start'
                  w='100%'
                >
                  <Text color='heading' size='l' variant='heading' tag='h1'>
                    {messages.title}
                  </Text>
                  <Text color='default' size='l' variant='body' tag='h2'>
                    {messages.subHeader}
                  </Text>
                </Flex>
                <Flex
                  direction='column'
                  gap='l'
                  w='100%'
                  alignItems='flex-start'
                >
                  <HarmonyTextField
                    name='email'
                    autoFocus
                    autoComplete='email'
                    label={messages.emailLabel}
                  />
                  <Flex w='100%' alignItems='center' gap='s'>
                    <Divider className={styles.flex1} />
                    <Text variant='body' size='m' tag='p' color='subdued'>
                      {messages.socialsDividerText}
                    </Text>
                    <Divider className={styles.flex1} />
                  </Flex>
                  <SocialMediaLoginOptions
                    onLoginFailure={handleSocialLoginError}
                    onInstagramLogin={handleInstagramLogin}
                    onTikTokLogin={handleTikTokLogin}
                    onTwitterLogin={handleTwitterLogin}
                  />
                </Flex>
                <Flex
                  direction='column'
                  gap='l'
                  alignItems='flex-start'
                  w='100%'
                >
                  <Button
                    variant={ButtonType.PRIMARY}
                    type='submit'
                    fullWidth
                    iconRight={IconArrowRight}
                    isLoading={isSubmitting}
                  >
                    {messages.signUp}
                  </Button>

                  <Text size='l'>
                    {messages.haveAccount}{' '}
                    {/* TODO [C-3278]: Update with Harmony Link */}
                    <Link
                      to={SIGN_IN_PAGE}
                      variant='body'
                      size='medium'
                      strength='strong'
                      color='secondary'
                    >
                      {messages.signIn}
                    </Link>
                  </Text>
                </Flex>
              </LeftContentContainer>
            </Form>
          )}
        </Formik>
      </PageWithAudiusValues>
    </Flex>
  )
}
