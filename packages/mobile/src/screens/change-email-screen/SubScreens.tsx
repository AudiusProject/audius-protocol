import { HarmonyTextField, PasswordField } from 'app/components/fields'
import { SubScreen } from '../change-password-screen/SubScreen'
import { SubScreenHeader } from '../change-password-screen/SubScreenHeader'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { useAsync } from 'react-use'
import { useEffect } from 'react'
import { Box, Text } from '@audius/harmony-native'
import LoadingSpinner from 'app/components/loading-spinner'
import { useRNField } from 'app/hooks/useRNField'

const messages = {
  changeYourEmail: 'Change Your Email',
  confirmPasswordHelp: 'Please enter your current email and password.',
  currentEmail: 'Current Email',
  currentPassword: 'Current Password',
  newEmailHelp: 'Enter the new email you would like to use on Audius.',
  newEmail: 'New email'
}

export const CurrentEmail = () => {
  const [{ value: oldEmail }, , { setValue: setOldEmail }] =
    useRNField('oldEmail')
  // Load the email for the user
  const emailRequest = useAsync(audiusBackendInstance.getUserEmail)
  useEffect(() => {
    if (emailRequest.value) {
      setOldEmail(emailRequest.value)
    }
  }, [emailRequest.loading, emailRequest.value, setOldEmail])
  return (
    <Text variant='body' size='m'>
      {oldEmail !== '' ? (
        oldEmail
      ) : (
        <LoadingSpinner style={{ width: 16, height: 16 }} />
      )}
    </Text>
  )
}

export const ConfirmPasswordSubScreen = () => {
  return (
    <SubScreen>
      <SubScreenHeader
        title={messages.changeYourEmail}
        description={messages.confirmPasswordHelp}
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
}

export const NewEmailSubScreen = () => {
  return (
    <SubScreen>
      <SubScreenHeader
        title={messages.changeYourEmail}
        description={messages.newEmailHelp}
      />
      <HarmonyTextField name='email' label={messages.newEmail} />
    </SubScreen>
  )
}
