import { Suspense, useCallback, useContext, useState } from 'react'

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
import { Form, Formik, FormikErrors, FormikHelpers } from 'formik'
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
import { LeftContentContainer } from 'pages/sign-on/components/desktop/LeftContentContainer'
import { MetaMaskOption } from 'pages/sign-on/components/desktop/MetaMaskOption'
import { PageWithAudiusValues } from 'pages/sign-on/components/desktop/PageWithAudiusValues'
import { EMAIL_REGEX } from 'utils/email'
import lazyWithPreload from 'utils/lazyWithPreload'
import {
  SIGN_IN_PAGE,
  SIGN_UP_HANDLE_PAGE,
  SIGN_UP_PASSWORD_PAGE
} from 'utils/route'

import styles from './SignUpPage.module.css'

const showMetaMaskOption = !!window.ethereum
const ConnectedMetaMaskModal = lazyWithPreload(
  () => import('pages/sign-up-page/components/ConnectedMetaMaskModal'),
  0
)

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

  const [isMetaMaskModalOpen, setIsMetaMaskModalOpen] = useState(false)
  const handleMetaMaskSuccess = () => {
    setIsMetaMaskModalOpen(false)
    navigate(SIGN_UP_HANDLE_PAGE)
  }

  /** Checks if the email is already in use. If so, navigates to sign in page. If not, calls the `onSuccess` callback. */
  const checkAndSetEmail = useCallback(
    async ({
      onSuccess,
      values,
      setErrors
    }: {
      onSuccess: () => void
      values: SignUpEmailValues
      setErrors: (errors: FormikErrors<SignUpEmailValues>) => void
    }) => {
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
            onSuccess()
          }
        } catch (e) {
          // Unknown error state ¯\_(ツ)_/¯
          setErrors({ email: messages.unknownError })
        }
      }
    },
    [dispatch, navigate, queryContext]
  )

  const handleClickMetaMask = async ({
    values,
    validateForm,
    setErrors
  }: {
    values: SignUpEmailValues
    validateForm: (
      values: SignUpEmailValues
    ) => Promise<FormikErrors<SignUpEmailValues>>
    setErrors: (errors: FormikErrors<SignUpEmailValues>) => void
  }) => {
    const errors = await validateForm(values)
    if (errors.email) {
      return
    }
    await checkAndSetEmail({
      onSuccess: () => {
        setIsMetaMaskModalOpen(true)
      },
      values,
      setErrors
    })
  }

  const submitHandler = useCallback(
    async (
      values: SignUpEmailValues,
      helpers: FormikHelpers<SignUpEmailValues>
    ) => {
      await checkAndSetEmail({
        onSuccess: () => navigate(SIGN_UP_PASSWORD_PAGE),
        values,
        setErrors: helpers.setErrors
      })
    },
    [checkAndSetEmail, navigate]
  )

  return (
    <>
      <Flex h='100%' alignItems='center' justifyContent='center'>
        <PageWithAudiusValues>
          <Formik
            validationSchema={toFormikValidationSchema(FormSchema)}
            initialValues={initialValues}
            onSubmit={submitHandler}
            validateOnBlur
            validateOnChange={false}
          >
            {({ isSubmitting, setErrors, validateForm, values }) => (
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
                    {showMetaMaskOption ? (
                      <MetaMaskOption
                        fullWidth
                        onClick={() =>
                          handleClickMetaMask({
                            values,
                            validateForm,
                            setErrors
                          })
                        }
                      />
                    ) : null}
                  </Flex>
                </LeftContentContainer>
              </Form>
            )}
          </Formik>
        </PageWithAudiusValues>
      </Flex>
      {showMetaMaskOption ? (
        <Suspense fallback={null}>
          <ConnectedMetaMaskModal
            open={isMetaMaskModalOpen}
            onBack={() => setIsMetaMaskModalOpen(false)}
            onSuccess={handleMetaMaskSuccess}
          />
        </Suspense>
      ) : null}
    </>
  )
}
