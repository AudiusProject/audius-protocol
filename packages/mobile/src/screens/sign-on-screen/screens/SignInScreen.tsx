import { useCallback } from 'react'

import { signInPageMessages as messages } from '@audius/common'
import { signIn } from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { Flex, Text } from '@audius/harmony-native'
import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button } from 'app/components/core'
import { TextField } from 'app/components/fields'

import { Heading } from '../components/layout'

import type { SignOnScreenProps } from './types'

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
          <Heading heading={messages.title} centered />
          <View>
            <TextField
              name='email'
              label={messages.emailLabel}
              onChangeText={onChangeEmail}
            />
            <TextField name='password' label={messages.passwordLabel} />
          </View>
          <Flex gap='l'>
            <Button
              size='large'
              fullWidth
              title={messages.signIn}
              icon={IconArrow}
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
