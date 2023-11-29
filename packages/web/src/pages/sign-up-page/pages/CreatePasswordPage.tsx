import { useCallback } from 'react'

import {
  Box,
  Button,
  ButtonType,
  Flex,
  IconArrowRight,
  Text,
  TextLink
} from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import { PasswordField } from 'components/form-fields/PasswordField'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import {
  PRIVACY_POLICY,
  SIGN_UP_HANDLE_PAGE,
  TERMS_OF_SERVICE
} from 'utils/route'

import { CompletionChecklist } from '../components/CompletionChecklist'
import { ContinueFooter } from '../components/ContinueFooter'
import { passwordSchema } from '../utils/passwordSchema'

const messages = {
  createYourPassword: 'Create Your Password',
  description:
    'Create a password that’s secure and easy to remember! We can’t reset your password, so write it down or use a password manager.',
  yourEmail: 'Your Email',
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
  password: '',
  confirmPassword: ''
}

export type CreatePasswordValues = {
  password: string
  confirmPassword: string
}

const passwordFormikSchma = toFormikValidationSchema(passwordSchema)

export const CreatePasswordPage = () => {
  const dispatch = useDispatch()
  const emailField = useSelector(getEmailField)
  const navigate = useNavigateToPage()
  const { isMobile } = useMedia()

  const handleSubmit = useCallback(
    (values: CreatePasswordValues) => {
      const { password } = values
      dispatch(setValueField('password', password))
      navigate(SIGN_UP_HANDLE_PAGE)
    },
    [dispatch, navigate]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={passwordFormikSchma}
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
                {messages.createYourPassword}
              </Text>
              <Text color='default' size={isMobile ? 'm' : 'l'} variant='body'>
                {messages.description}
              </Text>
            </Flex>
            <Flex direction='column' h='100%' gap='l'>
              <Box>
                <Text variant='label' size='xs'>
                  {messages.yourEmail}
                </Text>
                <Text variant='body' size='m'>
                  {emailField.value}
                </Text>
              </Box>
              <Flex direction='column' gap='l'>
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
