import { useEffect, useState } from 'react'

import { Status } from '@audius/common/models'
import {
  changePasswordSelectors,
  changePasswordActions
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import {
  Flex,
  IconArrowRight,
  PasswordInput,
  TextInput
} from '@audius/harmony-native'
import { Button } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { StatusMessage } from 'app/components/status-message'
import { useThemeColors } from 'app/utils/theme'
const { confirmCredentials } = changePasswordActions
const { getConfirmCredentialsStatus } = changePasswordSelectors

type Credentials = {
  email: string
  password: string
}

type ConfirmCredentialsProps = {
  onComplete: (credentials: Credentials) => void
}

const messages = {
  emailPlaceholder: 'Email',
  passwordPlaceholder: 'Current Password',
  buttonText: 'Continue',
  errorText: 'Invalid Credentials'
}

export const ConfirmCredentials = ({ onComplete }: ConfirmCredentialsProps) => {
  const dispatch = useDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorSeen, setErrorSeen] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const status = useSelector(getConfirmCredentialsStatus)
  const { neutralLight4, primary } = useThemeColors()

  const handleEmailChange = (val: string) => setEmail(val)
  const handlePasswordChange = (val: string) => setPassword(val)
  const handleKeyPress = () => setErrorSeen(true)

  const onSubmit = () => {
    dispatch(confirmCredentials({ email, password }))
    setHasSubmitted(true)
    setErrorSeen(false)
  }

  useEffect(() => {
    if (hasSubmitted) {
      if (status === Status.SUCCESS) {
        setHasSubmitted(false)
        onComplete({ email, password })
      } else if (status === Status.ERROR) {
        setHasSubmitted(false)
      }
    }
  }, [email, hasSubmitted, onComplete, password, status])

  return (
    <Flex w='100%' gap='l' mt='xl'>
      <TextInput
        onChangeText={handleEmailChange}
        onKeyPress={handleKeyPress}
        textContentType='emailAddress'
        label={messages.emailPlaceholder}
        value={email}
      />
      <PasswordInput
        onChangeText={handlePasswordChange}
        onKeyPress={handleKeyPress}
        label={messages.passwordPlaceholder}
        value={password}
      />
      {status === Status.ERROR && !errorSeen ? (
        <StatusMessage label={messages.errorText} status='error' />
      ) : null}
      <Button
        styles={{
          button: {
            width: '100%',
            borderRadius: 4,
            backgroundColor: status === Status.LOADING ? neutralLight4 : primary
          }
        }}
        fullWidth
        onPress={onSubmit}
        icon={status === Status.LOADING ? LoadingSpinner : IconArrowRight}
        iconPosition='right'
        title={messages.buttonText}
      />
    </Flex>
  )
}
