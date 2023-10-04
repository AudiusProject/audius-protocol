import { useCallback } from 'react'

import { setValueField } from 'audius-client/src/common/store/pages/signon/actions'
import { Formik } from 'formik'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { Link } from '@audius/harmony-native'
import { Button, Text } from 'app/components/core'
import { TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'

import type { RootScreenParamList } from '../../root-screen'
import type { SignUpScreenParamList } from '../types'

const messages = {
  header: 'Sign Up For Audius',
  emailLabel: 'Email',
  signUp: 'Sign Up Free',
  signInDescription: 'Already have an account?',
  signIn: 'Sign In'
}

const initialValues = {
  email: '',
  cover_photo: null
}

type SignUpEmailValues = {
  email: string
}
export const SignUpScreen = () => {
  const dispatch = useDispatch()
  const navigation = useNavigation<SignUpScreenParamList>()

  const handleSubmit = useCallback(
    (values: SignUpEmailValues) => {
      const { email } = values
      dispatch(setValueField('email', email))
      navigation.navigate('CreatePassword', { email })
    },
    [dispatch, navigation]
  )

  return (
    <View>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ handleSubmit }) => (
          <View>
            <Text role='heading'>{messages.header}</Text>
            <TextField name='email' label={messages.emailLabel} />
            <Button title={messages.signUp} onPress={() => handleSubmit()} />
          </View>
        )}
      </Formik>

      <View>
        <Text>{messages.signInDescription}</Text>
        <Link<RootScreenParamList> to={{ screen: 'SignIn' }}>
          {messages.signIn}
        </Link>
      </View>
    </View>
  )
}
