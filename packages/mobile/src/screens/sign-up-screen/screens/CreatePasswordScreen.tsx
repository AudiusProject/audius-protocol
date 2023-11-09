import { useCallback } from 'react'

import { setValueField } from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { Button, Text } from 'app/components/core'
import { TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'

import type { SignUpScreenParamList } from '../types'
import { useRoute } from '../useRoute'

const messages = {
  header: 'Create Your Password',
  description:
    "Create a password that's secure and easy to remember! We can't reset your password, so write it down or use a password manager.",
  yourEmail: 'Your Email',
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm Password',
  continue: 'Continue'
}

export type CreatePasswordParams = {
  email: string
}

const initialValues = {
  password: '',
  confirmPassword: ''
}

type CreatePasswordValues = {
  password: string
  confirmPassword: string
}

export const CreatePasswordScreen = () => {
  const { params } = useRoute<'CreatePassword'>()
  const { email } = params
  const dispatch = useDispatch()
  const navigation = useNavigation<SignUpScreenParamList>()

  const handleSubmit = useCallback(
    (values: CreatePasswordValues) => {
      const { password } = values
      dispatch(setValueField('password', password))
      navigation.navigate('PickHandle')
    },
    [dispatch, navigation]
  )

  return (
    <View>
      <Text>{messages.header}</Text>
      <Text>{messages.description}</Text>

      <Text>{messages.yourEmail}</Text>
      <Text>{email}</Text>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ handleSubmit }) => (
          <View>
            <TextField
              name='password'
              label={messages.passwordLabel}
              textContentType='password'
              secureTextEntry
            />
            <TextField
              name='confirmPassword'
              label={messages.confirmPasswordLabel}
              textContentType='password'
              secureTextEntry
            />
            <Button title={messages.continue} onPress={() => handleSubmit()} />
          </View>
        )}
      </Formik>
    </View>
  )
}
