import {
  emailSchemaMessages,
  createEmailPageMessages as messages
} from '@audius/common'
import { ErrorMessage } from 'formik'

import { Hint, IconError, Text } from '@audius/harmony-native'

type EmailInUseHintProps = {
  onChangeScreen: (screen: string) => void
}

export const EmailInUseHint = (props: EmailInUseHintProps) => {
  const { onChangeScreen } = props

  return (
    <ErrorMessage name='email'>
      {(errorMessage) =>
        errorMessage === emailSchemaMessages.emailInUse ? (
          <Hint icon={IconError}>
            <Text variant='body' size='m' textAlign='center'>
              {emailSchemaMessages.emailInUse}{' '}
              <Text onPress={() => onChangeScreen('sign-in')} color='accent'>
                {messages.signIn}
              </Text>
            </Text>
          </Hint>
        ) : null
      }
    </ErrorMessage>
  )
}
