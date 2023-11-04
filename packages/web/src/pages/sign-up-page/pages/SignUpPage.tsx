import { useCallback, useContext } from 'react'

import { AudiusQueryContext, signUpFetch } from '@audius/common'
import {
  Button,
  ButtonType,
  Divider,
  Flex,
  IconArrowRight,
  Text,
  SocialButton
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
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { EMAIL_REGEX } from 'utils/email'
import { SIGN_IN_PAGE, SIGN_UP_PASSWORD_PAGE } from 'utils/route'

import styles from './SignUpPage.module.css'
import { LeftContentContainer } from 'pages/sign-on/components/desktop/LeftContentContainer'
import { PageWithAudiusValues } from 'pages/sign-on/components/desktop/PageWithAudiusValues'

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
  unknownError: 'Unknown error occurred.'
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
                  <Flex direction='row' gap='s' w='100%'>
                    <SocialButton
                      socialType='twitter'
                      className={styles.flex1}
                      aria-label='Sign up with Twitter'
                    />
                    <SocialButton
                      socialType='instagram'
                      className={styles.flex1}
                      aria-label='Sign up with Instagram'
                    />
                    <SocialButton
                      socialType='tiktok'
                      className={styles.flex1}
                      aria-label='Sign up with TikTok'
                    />
                  </Flex>
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
