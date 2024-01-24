import { useCallback } from 'react'

import {
  emailSchema,
  createLoginDetailsPageMessages as messages,
  useAudiusQueryContext
} from '@audius/common'
import { Flex, IconVerified, useTheme } from '@audius/harmony'
import { Form, Formik, useField } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import {
  getEmailField,
  getHandleField,
  getIsVerified
} from 'common/store/pages/signon/selectors'
import { PasswordField } from 'components/form-fields/PasswordField'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_FINISH_PROFILE_PAGE } from 'utils/route'

import { NewEmailField } from '../components/EmailField'
import { PasswordCompletionChecklist } from '../components/PasswordCompletionChecklist'
import { SignUpAgreementText } from '../components/SignUpPolicyText'
import { Heading, Page, PageFooter, ReadOnlyField } from '../components/layout'
import { loginDetailsSchema } from '../utils/loginDetailsSchema'

export type CreateLoginDetailsValues = {
  email: string
  password: string
  confirmPassword: string
}

// Same email field but with extra logic to check initial value coming from redux store
const EmailField = () => {
  const [, , { setValue }] = useField('email')
  const existingEmailValue = useSelector(getEmailField)
  const audiusQueryContext = useAudiusQueryContext()

  // For the email field on this page, design requested that the field only be prepoulated if the email is valid.
  // Since the schema is async we have to do some async shenanigans to set the value after mount.
  useAsync(async () => {
    const schema = emailSchema(audiusQueryContext)
    try {
      await schema.parseAsync({
        email: existingEmailValue.value
      })
      setValue(existingEmailValue.value)
    } catch (e) {
      // invalid schema means we don't update the initial value
    }
  }, [])
  return <NewEmailField />
}

const loginDetailsFormikSchema = toFormikValidationSchema(loginDetailsSchema)

export const CreateLoginDetailsPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const handleField = useSelector(getHandleField)

  const { spacing } = useTheme()

  const isVerified = useSelector(getIsVerified)

  const initialValues = {
    email: '',
    password: '',
    confirmPassword: ''
  }

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
        <Page as={Form} transition='horizontal' centered>
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
              <EmailField />
              <PasswordField name='password' label={messages.passwordLabel} />
              <PasswordField
                name='confirmPassword'
                label={messages.confirmPasswordLabel}
              />
              <PasswordCompletionChecklist />
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
