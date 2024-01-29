import { emailSchemaMessages } from '@audius/common'
import { createEmailPageMessages as messages } from '@audius/common/messages'

import { Hint, IconError, Text, TextLink } from '@audius/harmony-native'

export type EmailInUseHintProps = {
  onChangeScreen: (screen: string) => void
}

export const EmailInUseHint = (props: EmailInUseHintProps) => {
  const { onChangeScreen } = props

  return (
    <Hint icon={IconError}>
      <Text variant='body' size='m' textAlign='center'>
        {emailSchemaMessages.emailInUse}{' '}
        <TextLink variant='visible' onPress={() => onChangeScreen('sign-in')}>
          {messages.signIn}
        </TextLink>
      </Text>
    </Hint>
  )
}
