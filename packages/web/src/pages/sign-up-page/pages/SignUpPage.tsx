import { useCallback, useEffect } from 'react'

import { Status } from '@audius/common'
import { useEmailInUse } from '@audius/common/src/api/signUp'
import {
  Button,
  ButtonType,
  Divider,
  Flex,
  IconArrowRight,
  Text,
  TextInput
} from '@audius/harmony'
import { useFormik } from 'formik'
import { useDispatch } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import { Link } from 'components/link'

import { setValueField } from '../../../common/store/pages/signon/actions'
import PreloadImage from '../../../components/preload-image/PreloadImage'
import { useNavigateToPage } from '../../../hooks/useNavigateToPage'
import { EMAIL_REGEX } from '../../../utils/email'
import { SIGN_IN_PAGE } from '../../../utils/route'
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
  dividerText: 'Or, get started with one of your socials',
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
  const [checkEmailInUse, result] = useEmailInUse()
  const { data: emailExists, status: emailApiStatus, errorMessage } = result
  const submitHandler = useCallback(
    (values: SignUpEmailValues) => {
      const { email } = values
      checkEmailInUse(email)
      dispatch(setValueField('email', email))
    },
    [dispatch, checkEmailInUse]
  )
  const formikForm = useFormik({
    initialValues,
    onSubmit: submitHandler,
    validationSchema: toFormikValidationSchema(FormSchema),
    validateOnBlur: true,
    validateOnChange: false
  })
  const {
    values,
    handleChange,
    handleBlur,
    touched,
    errors,
    handleSubmit,
    setErrors
  } = formikForm

  const isLoading = emailApiStatus === Status.LOADING

  // Check for API status changes (occurs after form submit)
  useEffect(() => {
    // Unknown error state
    if (emailApiStatus === Status.ERROR) {
      setErrors({ email: messages.unknownError })
      return
    }
    if (emailApiStatus === Status.SUCCESS) {
      if (emailExists) {
        // Redirect to sign in if the email exists already
        navigate(SIGN_IN_PAGE)
      } else {
        // Move onto the password page
        onNext({ stage: 'create-password' })
      }
    }
  }, [emailApiStatus, errorMessage, emailExists, onNext, navigate, setErrors])

  return (
    <>
      <form onSubmit={handleSubmit}>
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
            <TextInput
              name='email'
              autoFocus
              autoComplete='email'
              label={messages.emailLabel}
              error={!!errors.email && touched.email}
              helperText={
                errors.email && touched.email ? errors.email : undefined
              }
              className={styles.w100}
              onChange={(e) => {
                // Clear errors on user change (Formik doesn't have an out of the box way to do this for you)
                setErrors({ email: undefined })
                handleChange(e)
              }}
              onBlur={handleBlur}
              value={values.email}
              disabled={isLoading}
            />
            <Flex w='100%' alignItems='center' gap='s'>
              <Divider className={styles.flex1} />
              <Text variant='body' size='m' tag='p' color='subdued'>
                {messages.dividerText}
              </Text>
              <Divider className={styles.flex1} />
            </Flex>
            <Flex gap='s' w='100%' direction='row'>
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
              isLoading={isLoading}
            >
              {messages.signUp}
            </Button>

            <Text variant='body' size='l' tag='p' color='default'>
              {messages.haveAccount}{' '}
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
      </form>
    </>
  )
}
