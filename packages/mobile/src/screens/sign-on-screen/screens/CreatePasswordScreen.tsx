import { useCallback } from 'react'

import { createPasswordPageMessages as messages } from '@audius/common/messages'
import { passwordSchema } from '@audius/common/schemas'
import { setValueField } from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Flex } from '@audius/harmony-native'
import { ScrollView, KeyboardAvoidingView } from 'app/components/core'
import { PasswordField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'

import { PasswordCompletionChecklist } from '../components/PasswordCompletionChecklist'
import { SignUpAgreementText } from '../components/SignUpPolicyText'
import { Heading, Page, PageFooter, ReadOnlyField } from '../components/layout'
import type { SignUpScreenParamList } from '../types'
import { useTrackScreen } from '../utils/useTrackScreen'

const initialValues = {
  password: '',
  confirmPassword: ''
}

type CreatePasswordValues = {
  password: string
  confirmPassword: string
}

const passwordFormikSchema = toFormikValidationSchema(passwordSchema)

export const CreatePasswordScreen = () => {
  const { value: email } = useSelector(getEmailField)
  const dispatch = useDispatch()
  const navigation = useNavigation<SignUpScreenParamList>()

  useTrackScreen('CreatePassword')

  const handleSubmit = useCallback(
    (values: CreatePasswordValues) => {
      const { password } = values
      dispatch(setValueField('password', password))
      navigation.navigate('PickHandle')
    },
    [dispatch, navigation]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={passwordFormikSchema}
    >
      <Page>
        <ScrollView>
          <KeyboardAvoidingView keyboardShowingOffset={220}>
            <Flex direction='column' h='100%' gap='l'>
              <Heading
                heading={messages.createYourPassword}
                description={messages.description}
              />

              <ReadOnlyField label={messages.yourEmail} value={email} />
              <PasswordField
                name='password'
                clearErrorOnChange={false}
                label={messages.passwordLabel}
              />
              <PasswordField
                name='confirmPassword'
                clearErrorOnChange={false}
                label={messages.confirmPasswordLabel}
              />
              <PasswordCompletionChecklist />
              <SignUpAgreementText />
            </Flex>
          </KeyboardAvoidingView>
        </ScrollView>
        <PageFooter />
      </Page>
    </Formik>
  )
}
