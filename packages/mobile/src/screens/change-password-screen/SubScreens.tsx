import { formatOtp } from '@audius/common/schemas'

import { Box, Text } from '@audius/harmony-native'
import { HarmonyTextField } from 'app/components/fields/HarmonyTextField'
import { PasswordField } from 'app/components/fields/PasswordField'

import { PasswordCompletionChecklist } from '../sign-on-screen/components/PasswordCompletionChecklist'

import { ResendCodeLink } from './ResendCodeLink'
import { SubScreen } from './SubScreen'
import { SubScreenHeader } from './SubScreenHeader'
import { CurrentEmail } from '../change-email-screen/SubScreens'

const messages = {
  changeYourPassword: 'Change Your Password',

  confirmPasswordDescription: 'Please enter your current email and password.',
  currentEmail: 'Current Email',
  currentPassword: 'Current Password',

  verifyEmailDescription: 'Enter the verification code sent to your email.',
  email: 'Email',
  code: 'Code',
  otpPlaceholder: '123 456',
  resendHelp: 'Didn’t get an email? ',

  newPasswordDescription:
    'Create a new password that’s secure and easy to remember! ',
  password: 'Password',
  confirmPassword: 'Confirm Password',

  passwordUpdated: 'Password Updated!',
  successDescription: 'Your password was successfully changed!'
}

export const ConfirmPasswordSubScreen = () => (
  <SubScreen>
    <SubScreenHeader
      title={messages.changeYourPassword}
      description={messages.confirmPasswordDescription}
    />
    <Box>
      <Text variant='label' size={'xs'}>
        {messages.currentEmail}
      </Text>
      <CurrentEmail />
    </Box>
    <PasswordField
      name='password'
      label={messages.currentPassword}
      autoComplete={'password'}
      clearErrorOnChange={false}
      helperText={undefined}
    />
  </SubScreen>
)

export const VerifyEmailSubScreen = () => (
  <SubScreen>
    <SubScreenHeader
      title={messages.changeYourPassword}
      description={messages.verifyEmailDescription}
    />
    <HarmonyTextField
      name='otp'
      label={messages.code}
      keyboardType='number-pad'
      placeholder={messages.otpPlaceholder}
      transformValueOnChange={formatOtp}
    />
    <Text variant='body'>
      {messages.resendHelp} <ResendCodeLink />
    </Text>
  </SubScreen>
)

export const NewPasswordSubScreen = () => (
  <SubScreen>
    <SubScreenHeader
      title={messages.changeYourPassword}
      description={messages.newPasswordDescription}
    />
    <PasswordField
      name='password'
      label={messages.password}
      helperText={undefined}
    />
    <PasswordField
      name='confirmPassword'
      label={messages.confirmPassword}
      helperText={undefined}
    />
    <PasswordCompletionChecklist />
  </SubScreen>
)
