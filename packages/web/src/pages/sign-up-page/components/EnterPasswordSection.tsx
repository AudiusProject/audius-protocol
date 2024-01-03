import { Flex } from '@audius/harmony'

import { PasswordField } from 'components/form-fields/PasswordField'

import { PasswordCompletionChecklist } from './PasswordCompletionChecklist'

const messages = {
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm Password'
}

export const EnterPasswordSection = () => {
  return (
    <Flex direction='column' gap='l'>
      <PasswordField name='password' label={messages.passwordLabel} autoFocus />
      <PasswordField
        name='confirmPassword'
        label={messages.confirmPasswordLabel}
      />
      <PasswordCompletionChecklist />
    </Flex>
  )
}
