import { useCallback } from 'react'

import {
  Button,
  ButtonType,
  Flex,
  IconArrowRight,
  Text,
  TextLink
} from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { PasswordField } from 'components/form-fields/PasswordField'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import {
  PRIVACY_POLICY,
  SIGN_UP_FINISH_PROFILE_PAGE,
  TERMS_OF_SERVICE
} from 'utils/route'

import { CompletionChecklist } from '../components/CompletionChecklist'
import { ContinueFooter } from '../components/ContinueFooter'
import { loginDetailsSchema } from '../utils/loginDetailsSchema'

const messages = {
  title: 'Create Login Details',
  description: `Enter your email and create a password. Keep in mind that we can't reset your password.`,
  emailLabel: 'Email',
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm Password',
  continue: 'Continue',
  agreeTo:
    "By clicking continue, you state you have read and agree to Audius' ",
  termsOfService: 'Terms of Service',
  and: ' and ',
  privacyPolicy: 'Privacy Policy.',
  goBack: 'Go back',
  emailInUse: 'That email is already used by another Audius account.'
}

const initialValues = {
  email: '',
  password: '',
  confirmPassword: ''
}

export type CreateLoginDetailsValues = {
  email: string
  password: string
  confirmPassword: string
}

const loginDetailsFormikSchema = toFormikValidationSchema(loginDetailsSchema)

export const CreateLoginDetailsPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const { isMobile } = useMedia()

  const handleSubmit = useCallback(
    (values: CreateLoginDetailsValues) => {
      const { email, password } = values
      dispatch(setValueField('email', email))
      dispatch(setValueField('password', password))
      navigate(SIGN_UP_FINISH_PROFILE_PAGE)
    },
    [dispatch, navigate]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={loginDetailsFormikSchema}
    >
      {({ isValid, dirty }) => (
        <Flex
          as={Form}
          direction='column'
          pv={isMobile ? 'xl' : '2xl'}
          ph={isMobile ? 'l' : '2xl'}
          h='100%'
          justifyContent='space-between'
        >
          <Flex direction='column' gap='2xl'>
            <Flex direction='column' gap='s'>
              <Text
                color='heading'
                size={isMobile ? 'm' : 'l'}
                strength='default'
                variant='heading'
              >
                {messages.title}
              </Text>
              <Text color='default' size={isMobile ? 'm' : 'l'} variant='body'>
                {messages.description}
              </Text>
            </Flex>
            <Flex direction='column' h='100%' gap='l'>
              <Flex direction='column' gap='l'>
                <HarmonyTextField
                  name='email'
                  autoComplete='email'
                  label={messages.emailLabel}
                />
                <PasswordField name='password' label={messages.passwordLabel} />
                <PasswordField
                  name='confirmPassword'
                  label={messages.confirmPasswordLabel}
                />
                <CompletionChecklist />
              </Flex>
            </Flex>
          </Flex>
          <ContinueFooter shadow='flat' p={isMobile ? 'l' : '2xl'}>
            <Text color='default' size='s' strength='default' variant='body'>
              {messages.agreeTo}
              <TextLink href={TERMS_OF_SERVICE} variant='visible' isExternal>
                {messages.termsOfService}
              </TextLink>
              {messages.and}
              <TextLink href={PRIVACY_POLICY} variant='visible' isExternal>
                {messages.privacyPolicy}
              </TextLink>
            </Text>
            <Button
              variant={ButtonType.PRIMARY}
              disabled={!(dirty && isValid)}
              type='submit'
              fullWidth
              iconRight={IconArrowRight}
            >
              {messages.continue}
            </Button>
          </ContinueFooter>
        </Flex>
      )}
    </Formik>
  )
}
