import { useCallback } from 'react'

import { signInPageMessages as messages, signInSchema } from '@audius/common'
import { getStatus } from 'audius-client/src/common/store/pages/signon/selectors'
import { signIn } from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Flex, Text } from '@audius/harmony-native'
import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button } from 'app/components/core'
import { PasswordField } from 'app/components/fields'

import { EmailField } from '../components/EmailField'
import { Heading } from '../components/layout'

import type { SignOnScreenProps } from './types'

const signinFormikSchema = toFormikValidationSchema(signInSchema)

type SignInValues = {
  email: string
  password: string
}

export const SignInScreen = (props: SignOnScreenProps) => {
  const { email, onChangeEmail } = props
  const dispatch = useDispatch()
  const signInStatus = useSelector(getStatus)

  const initialValues = {
    email,
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
          <View>
            <EmailField
              name='email'
              label={messages.emailLabel}
              onChangeText={onChangeEmail}
            />
            <PasswordField name='password' label={messages.passwordLabel} />
          </View>
          <Flex gap='l'>
            <Button
              size='large'
              fullWidth
              title={messages.signIn}
              icon={IconArrow}
              disabled={signInStatus === 'loading'}
              onPress={() => handleSubmit()}
            />
            <Text color='accent' textAlign='center'>
              {messages.forgotPassword}
            </Text>
          </Flex>
        </>
      )}
    </Formik>
  )
}
