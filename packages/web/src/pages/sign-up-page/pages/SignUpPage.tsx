import { useCallback, useContext } from 'react'

import { AudiusQueryContext, signUpFetch } from '@audius/common'
import {
  Button,
  ButtonType,
  Divider,
  Flex,
  IconArrowRight,
  Text
} from '@audius/harmony'
import { Form, Formik, FormikHelpers } from 'formik'
import { useDispatch } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import { setValueField } from 'common/store/pages/signon/actions'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { Link } from 'components/link'
import PreloadImage from 'components/preload-image/PreloadImage'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { EMAIL_REGEX } from 'utils/email'
import { SIGN_IN_PAGE } from 'utils/route'

import { SocialButton } from '../components/SocialButton'

import { CreatePasswordState } from './CreatePasswordPage'
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
  unknownError: 'Unknown error occurred.'
}

export type SignUpState = {
  stage: 'sign-up'
  email?: string
}

export type SignUpPageProps = {
  onNext: (state: CreatePasswordState) => void
}

const initialValues = {
  email: ''
}

type SignUpEmailValues = {
  email: string
}

const FormSchema = z.object({
  email: z
    .string({ required_error: messages.invalidEmail })
    .regex(EMAIL_REGEX, { message: messages.invalidEmail })
})

export const SignUpPage = (props: SignUpPageProps) => {
  const { onNext } = props
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const queryContext = useContext(AudiusQueryContext)
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
            onNext({ stage: 'create-password' })
          }
        } catch (e) {
          // Unknown error state ¯\_(ツ)_/¯
          setErrors({ email: messages.unknownError })
        }
      }
    },
    [dispatch, navigate, onNext, queryContext]
  )

  return (
    <Formik
      validationSchema={toFormikValidationSchema(FormSchema)}
      initialValues={initialValues}
      onSubmit={submitHandler}
      validateOnBlur
      validateOnChange={false}
    >
      {({ isSubmitting }) => (
        <Form>
          <Flex
            direction='column'
            alignItems='center'
            ph='2xl'
            pv='4xl'
            gap='2xl'
          >
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
              className={styles.leftAlignText}
            >
              <Text color='heading' size='l' variant='heading' tag='h1'>
                {messages.title}
              </Text>
              <Text color='default' size='l' variant='body' tag='h2'>
                {messages.subHeader}
              </Text>
            </Flex>
            <Flex direction='column' gap='l' w='100%' alignItems='flex-start'>
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
                <SocialButton socialType='twitter' className={styles.flex1} />
                <SocialButton socialType='instagram' className={styles.flex1} />
                <SocialButton socialType='tiktok' className={styles.flex1} />
              </Flex>
            </Flex>
            <Flex direction='column' gap='l' alignItems='flex-start' w='100%'>
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
          </Flex>
        </Form>
      )}
    </Formik>
  )
}
