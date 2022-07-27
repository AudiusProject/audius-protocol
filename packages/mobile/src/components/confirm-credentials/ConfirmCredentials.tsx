import { useEffect, useState } from 'react'

import { Status } from '@audius/common'
import { getConfirmCredentialsStatus } from 'audius-client/src/common/store/change-password/selectors'
import { confirmCredentials } from 'audius-client/src/common/store/change-password/slice'
import { View } from 'react-native'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button, TextInput } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { StatusMessage } from 'app/components/status-message/'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

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

const useStyles = makeStyles(({ spacing }) => ({
  input: {
    marginTop: spacing(3),
    paddingVertical: spacing(3)
  },
  button: {
    marginTop: spacing(4)
  }
}))

export const ConfirmCredentials = ({ onComplete }: ConfirmCredentialsProps) => {
  const dispatchWeb = useDispatchWeb()
  const styles = useStyles()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorSeen, setErrorSeen] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const status = useSelectorWeb(getConfirmCredentialsStatus)
  const { neutralLight4, primary } = useThemeColors()

  const handleEmailChange = (val: string) => setEmail(val)
  const handlePasswordChange = (val: string) => setPassword(val)
  const handleKeyPress = () => setErrorSeen(true)

  const onSubmit = () => {
    dispatchWeb(confirmCredentials({ email, password }))
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
    <View style={{ width: '100%' }}>
      <TextInput
        style={styles.input}
        onChangeText={handleEmailChange}
        onKeyPress={handleKeyPress}
        textContentType='emailAddress'
        placeholder={messages.emailPlaceholder}
        value={email}
      />
      <TextInput
        style={styles.input}
        onChangeText={handlePasswordChange}
        onKeyPress={handleKeyPress}
        textContentType='password'
        secureTextEntry
        placeholder={messages.passwordPlaceholder}
        value={password}
      />
      {status === Status.ERROR && !errorSeen ? (
        <StatusMessage label={messages.errorText} status='error' />
      ) : null}
      <Button
        styles={{
          root: styles.button,
          button: {
            width: '100%',
            borderRadius: 4,
            backgroundColor: status === Status.LOADING ? neutralLight4 : primary
          }
        }}
        fullWidth
        onPress={onSubmit}
        icon={status === Status.LOADING ? LoadingSpinner : IconArrow}
        iconPosition='right'
        title={messages.buttonText}
      />
    </View>
  )
}
