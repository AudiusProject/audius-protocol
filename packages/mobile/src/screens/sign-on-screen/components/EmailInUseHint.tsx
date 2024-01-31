import { createEmailPageMessages } from '@audius/common/messages'
import { emailSchemaMessages } from '@audius/common/schemas'

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
          {createEmailPageMessages.signIn}
        </TextLink>
      </Text>
    </Hint>
  )
}
