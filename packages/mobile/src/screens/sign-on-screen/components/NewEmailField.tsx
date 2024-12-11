import { createEmailPageMessages } from '@audius/common/messages'
import { emailSchemaMessages } from '@audius/common/schemas'
import { useField, useFormikContext } from 'formik'
import { usePrevious } from 'react-use'

import { Hint, IconError, TextLink } from '@audius/harmony-native'

import type { SignOnScreenType } from '../screens/types'

import { EmailField, type EmailFieldProps } from './EmailField'

type NewEmailFieldProps = EmailFieldProps & {
  onChangeScreen: (screen: SignOnScreenType) => void
}

export const NewEmailField = (props: NewEmailFieldProps) => {
  const { onChangeScreen, ...other } = props
  const { name } = other

  const [, { error }] = useField(name)
  const { isValidating } = useFormikContext()
  const emailInUse = error === emailSchemaMessages.emailInUse
  const isGuest = error === emailSchemaMessages.completeYourProfile
  const hasSpecialError = emailInUse || isGuest

  // Track which specific error was shown last
  const lastShownError = usePrevious(error)

  const showEmailInUseError =
    emailInUse ||
    (isValidating && lastShownError === emailSchemaMessages.emailInUse)

  return (
    <>
      <EmailField
        {...props}
        error={hasSpecialError ? false : undefined}
        helperText={hasSpecialError ? false : undefined}
      />
      {showEmailInUseError ? (
        <Hint icon={IconError}>
          {emailSchemaMessages.emailInUse}{' '}
          <TextLink variant='visible' onPress={() => onChangeScreen('sign-in')}>
            {createEmailPageMessages.signIn}
          </TextLink>
        </Hint>
      ) : null}
    </>
  )
}
