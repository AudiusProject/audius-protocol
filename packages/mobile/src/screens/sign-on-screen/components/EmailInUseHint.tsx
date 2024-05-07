import { createEmailPageMessages } from '@audius/common/messages'
import { emailSchemaMessages } from '@audius/common/schemas'

import { Hint, IconError, TextLink } from '@audius/harmony-native'

export type EmailInUseHintProps = {
  onChangeScreen: (screen: string) => void
}

export const EmailInUseHint = (props: EmailInUseHintProps) => {
  const { onChangeScreen } = props

  return (
    <Hint icon={IconError}>
      {emailSchemaMessages.emailInUse}{' '}
      <TextLink variant='visible' onPress={() => onChangeScreen('sign-in')}>
        {createEmailPageMessages.signIn}
      </TextLink>
    </Hint>
  )
}
