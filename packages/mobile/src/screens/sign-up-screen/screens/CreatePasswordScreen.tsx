import { useCallback } from 'react'

import { getEmailField } from 'audius-client/src/common/store/pages/signon/selectors'
import { setValueField } from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Flex } from '@audius/harmony-native'
import { Button } from 'app/components/core'
import { TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'

import { SignUpAgreementText } from '../components/SignUpPolicyText'
import { Heading, Page, PageFooter, ReadOnlyField } from '../components/layout'
import type { SignUpScreenParamList } from '../types'
import { useRoute } from '../useRoute'

const messages = {
  heading: 'Create Your Password',
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
  const emailField = useSelector(getEmailField)
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
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ handleSubmit, dirty, isValid }) => (
          <Page>
            <Heading
              heading={messages.heading}
              description={messages.description}
            />
            <Flex direction='column' h='100%' gap='l'>
              <ReadOnlyField label={messages.yourEmail} value={email} />
              <TextField
                name='password'
                label={messages.passwordLabel}
                textContentType='password'
                secureTextEntry
                noGutter
              />
              <TextField
                name='confirmPassword'
                label={messages.confirmPasswordLabel}
                textContentType='password'
                secureTextEntry
                noGutter
              />
            </Flex>
            <Button title={messages.continue} onPress={() => handleSubmit()} />
            <PageFooter
              shadow='flat'
              p='l'
              prefix={<SignUpAgreementText />}
              buttonProps={{ disabled: !(dirty && isValid) }}
            />
          </Page>
        )}
      </Formik>
    </View>
  )
}
