import { RefObject } from 'react'

import { Flex } from '@audius/harmony'

import { PasswordField } from 'components/form-fields/PasswordField'

import { PasswordCompletionChecklist } from './PasswordCompletionChecklist'

const messages = {
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm Password'
}

type EnterPasswordSectionProps = {
  inputRef?: RefObject<HTMLInputElement>
}

export const EnterPasswordSection = (props: EnterPasswordSectionProps) => {
  const { inputRef } = props
  return (
    <Flex direction='column' gap='l'>
      <PasswordField
        name='password'
        label={messages.passwordLabel}
        ref={inputRef}
      />
      <PasswordField
        name='confirmPassword'
        label={messages.confirmPasswordLabel}
      />
      <PasswordCompletionChecklist />
    </Flex>
  )
}
