import { useCallback, useMemo } from 'react'

import { Flex, IconVerified, useTheme } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import {
  getEmailField,
  getHandleField,
  getIsVerified
} from 'common/store/pages/signon/selectors'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { PasswordField } from 'components/form-fields/PasswordField'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_FINISH_PROFILE_PAGE } from 'utils/route'

import { CompletionChecklist } from '../components/CompletionChecklist'
import { SignUpAgreementText } from '../components/SignUpPolicyText'
import { Heading, Page, PageFooter, ReadOnlyField } from '../components/layout'
import { loginDetailsSchema } from '../utils/loginDetailsSchema'
import { useAudiusQueryContext } from '@audius/common'

const messages = {
  title: 'Create Login Details',
  description: `Enter your email and create a password. Keep in mind that we can't reset your password.`,
  emailLabel: 'Email',
  handleLabel: 'Handle',
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm Password'
}

export type CreateLoginDetailsValues = {
  email: string
  password: string
  confirmPassword: string
}

export const CreateLoginDetailsPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const handleField = useSelector(getHandleField)
  const existingEmailValue = useSelector(getEmailField)

  const { spacing } = useTheme()

  const isVerified = useSelector(getIsVerified)

  const initialValues = {
    email: existingEmailValue.value ?? '',
    password: '',
    confirmPassword: ''
  }
  const audiusQueryContext = useAudiusQueryContext()

  const loginDetailsFormikSchema = useMemo(
    () => toFormikValidationSchema(loginDetailsSchema(audiusQueryContext)),
    [audiusQueryContext]
  )

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
              <ReadOnlyField
                label={messages.handleLabel}
                value={
                  <Flex alignItems='center' gap='xs'>
                    @{handleField.value}
                    {isVerified ? (
                      <IconVerified
                        css={{ height: spacing.unit3, width: spacing.unit3 }}
                      />
                    ) : null}
                  </Flex>
                }
              />
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
            buttonProps={{
              disabled: !(
                (dirty || (initialValues.email && initialValues.password)) &&
                isValid
              )
            }}
          />
        </Page>
      )}
    </Formik>
  )
}
