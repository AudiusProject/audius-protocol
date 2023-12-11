import { useCallback } from 'react'

import { signIn } from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { Link } from '@audius/harmony-native'
import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button, Text } from 'app/components/core'
import { TextField } from 'app/components/fields'

const messages = {
  header: 'Sign into Audius',
  emailLabel: 'Email',
  passwordLabel: 'Password',
  signIn: 'Sign In'
}

type SignInValues = {
  email: string
  password: string
}

const initialValues = {
  email: '',
  password: ''
}

export const SignInScreen = () => {
  const dispatch = useDispatch()

  const handleSubmit = useCallback(
    (values: SignInValues) => {
      const { email, password } = values
      dispatch(signIn(email, password))
    },
    [dispatch]
  )

  return (
    <View>
      <Text role='heading'>{messages.header}</Text>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ handleSubmit }) => (
          <View>
            <TextField name='email' label={messages.emailLabel} />
            <TextField name='password' label={messages.passwordLabel} />
            <Button
              title={messages.signIn}
              icon={IconArrow}
              onPress={() => handleSubmit()}
            />
            <Link to={{ screen: 'SignUp' }} color='accentPurple'>
              Create Account
            </Link>
          </View>
        )}
      </Formik>
    </View>
  )
}
