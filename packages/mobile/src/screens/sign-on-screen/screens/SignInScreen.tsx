import { useCallback } from 'react'

import { signIn } from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { Text } from '@audius/harmony-native'
import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button } from 'app/components/core'
import { TextField } from 'app/components/fields'

import type { SignOnScreenProps } from './types'

const messages = {
  header: 'Sign into Audius',
  emailLabel: 'Email',
  passwordLabel: 'Password',
  signIn: 'Sign In',
  forgotPassword: 'Forgot password?'
}

type SignInValues = {
  email: string
  password: string
}

export const SignInScreen = (props: SignOnScreenProps) => {
  const { email, onChangeEmail } = props
  const dispatch = useDispatch()

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
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ handleSubmit }) => (
        <>
          <Text role='heading'>{messages.header}</Text>
          <View>
            <TextField
              name='email'
              label={messages.emailLabel}
              onChangeText={onChangeEmail}
            />
            <TextField name='password' label={messages.passwordLabel} />
            <Button
              title={messages.signIn}
              icon={IconArrow}
              onPress={() => handleSubmit()}
            />
            <Text color='accent'>{messages.forgotPassword}</Text>
          </View>
        </>
      )}
    </Formik>
  )
}
