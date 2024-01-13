import { useCallback } from 'react'

import { signInPageMessages as messages, signInSchema } from '@audius/common'
import {
  getEmailField,
  getStatus
} from 'audius-client/src/common/store/pages/signon/selectors'
import { signIn } from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Button, Flex, IconArrowRight, TextLink } from '@audius/harmony-native'
import { PasswordField } from 'app/components/fields'
import { useDrawer } from 'app/hooks/useDrawer'

import { EmailField } from '../components/EmailField'
import { Heading } from '../components/layout'

const signinFormikSchema = toFormikValidationSchema(signInSchema)

type SignInValues = {
  email: string
  password: string
}

export const SignInScreen = () => {
  const dispatch = useDispatch()
  const { value: existingEmailValue } = useSelector(getEmailField)
  const signInStatus = useSelector(getStatus)
  const { onOpen } = useDrawer('ForgotPassword')

  const initialValues = {
    email: existingEmailValue ?? '',
    password: ''
  }

  const handleSubmit = useCallback(
    (values: SignInValues) => {
      const { email, password } = values
      dispatch(signIn(email, password))
    },
    [dispatch]
  )

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={signinFormikSchema}
      onSubmit={handleSubmit}
    >
      {({ handleSubmit }) => (
        <>
          <Heading heading={messages.title} centered />
          <Flex gap='l'>
            <EmailField name='email' label={messages.emailLabel} />
            <PasswordField name='password' label={messages.passwordLabel} />
          </Flex>
          <Flex gap='l'>
            <Button
              size='default'
              fullWidth
              iconRight={IconArrowRight}
              isLoading={signInStatus === 'loading'}
              onPress={() => handleSubmit()}
            >
              {messages.signIn}
            </Button>
            <TextLink variant='visible' textAlign='center' onPress={onOpen}>
              {messages.forgotPassword}
            </TextLink>
          </Flex>
        </>
      )}
    </Formik>
  )
}
