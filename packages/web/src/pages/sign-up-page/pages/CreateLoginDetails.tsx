import { useCallback } from 'react'

import { Flex } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { PasswordField } from 'components/form-fields/PasswordField'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_FINISH_PROFILE_PAGE } from 'utils/route'

import { CompletionChecklist } from '../components/CompletionChecklist'
import { SignUpAgreementText } from '../components/SignUpPolicyText'
import { Heading, Page, PageFooter } from '../components/layout'
import { loginDetailsSchema } from '../utils/loginDetailsSchema'

const messages = {
  title: 'Create Login Details',
  description: `Enter your email and create a password. Keep in mind that we can't reset your password.`,
  emailLabel: 'Email',
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm Password'
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
        <Page as={Form} transition='horizontal'>
          <Heading
            heading={messages.title}
            description={messages.description}
          />
          <Flex direction='column' h='100%' gap='l'>
            <Flex direction='column' gap='l'>
              <HarmonyTextField
                name='email'
                autoComplete='email'
                label={messages.emailLabel}
                autoFocus
              />
              <PasswordField name='password' label={messages.passwordLabel} />
              <PasswordField
                name='confirmPassword'
                label={messages.confirmPasswordLabel}
              />
              <CompletionChecklist />
            </Flex>
          </Flex>
          <PageFooter
            shadow='flat'
            prefix={<SignUpAgreementText />}
            buttonProps={{ disabled: !(dirty && isValid) }}
          />
        </Page>
      )}
    </Formik>
  )
}
