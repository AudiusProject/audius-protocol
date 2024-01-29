import { useState } from 'react'

import commonPasswordList from 'fxa-common-password-list'
import { View } from 'react-native'

import { IconArrow } from '@audius/harmony-native'
import { Button, TextInput } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { StatusMessage } from 'app/components/status-message'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

type CheckState = 'error' | 'default' | 'valid'

type Requirements = {
  number: CheckState
  length: CheckState
  match: CheckState
  common: CheckState
}

const MIN_PASSWORD_LEN = 8

const getNumberRequirement = (password: string) => {
  if (password.length === 0) return 'default'
  if (!/\d/.test(password)) return 'error'
  return 'valid'
}

const getLengthRequirement = (password: string) => {
  if (password.length === 0) return 'default'
  if (password.length < MIN_PASSWORD_LEN) return 'error'
  return 'valid'
}

const getMatchRequirement = (
  password: string,
  passwordConfirmation: string
) => {
  if (password.length === 0) return 'default'
  if (password !== passwordConfirmation) return 'error'
  return 'valid'
}

const getCommonRequirement = (password: string) => {
  if (password.length < MIN_PASSWORD_LEN) return 'default'
  if (commonPasswordList.test(password)) return 'error'
  return 'valid'
}

const messages = {
  passwordPlaceholder: 'Password',
  confirmationPlaceholder: 'Confirm Password',
  checks: {
    number: 'Must contain numbers',
    length: 'Length must be at least 8 characters',
    match: 'Passwords match',
    common: 'Hard to guess'
  }
}

const useStyles = makeStyles(({ spacing }) => ({
  input: {
    marginTop: spacing(3),
    paddingVertical: spacing(3)
  },
  button: {
    width: '100%',
    borderRadius: 4
  },
  checkContainer: {
    marginTop: spacing(3),
    marginBottom: spacing(4)
  }
}))

type EnterPasswordProps = {
  isLoading?: boolean
  onSubmit: (password: string) => void
  submitButtonText: string
}

export const EnterPassword = (props: EnterPasswordProps) => {
  const { isLoading, onSubmit, submitButtonText } = props
  const styles = useStyles()
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [requirements, setRequirements] = useState<Requirements>({
    number: 'default',
    length: 'default',
    match: 'default',
    common: 'default'
  })
  const { neutralLight4, primary } = useThemeColors()

  const handlePasswordChange = (password: string) => {
    const number =
      requirements.number === 'default'
        ? getNumberRequirement(password) === 'valid'
          ? 'valid'
          : 'default'
        : getNumberRequirement(password)
    const length =
      requirements.length === 'default'
        ? getLengthRequirement(password) === 'valid'
          ? 'valid'
          : 'default'
        : getLengthRequirement(password)
    const common =
      requirements.common === 'default'
        ? getCommonRequirement(password) === 'valid'
          ? 'valid'
          : 'default'
        : getCommonRequirement(password)
    setPassword(password)
    setRequirements({
      ...requirements,
      number,
      length,
      common,
      match:
        passwordConfirmation === ''
          ? 'default'
          : getMatchRequirement(password, passwordConfirmation)
    })
  }

  const handlePasswordConfirmationChange = (passwordConfirmation: string) => {
    if (requirements.match !== 'default') {
      setRequirements({
        ...requirements,
        match:
          passwordConfirmation === ''
            ? 'default'
            : getMatchRequirement(password, passwordConfirmation)
      })
    } else if (password.length <= passwordConfirmation.length) {
      setRequirements({
        ...requirements,
        match: getMatchRequirement(password, passwordConfirmation)
      })
    }
    setPasswordConfirmation(passwordConfirmation)
  }

  const handlePasswordBlur = () => {
    // Check for password errors here
    if (password) {
      setRequirements({
        ...requirements,
        number: getNumberRequirement(password),
        length: getLengthRequirement(password),
        common: getCommonRequirement(password),
        match:
          passwordConfirmation === ''
            ? 'default'
            : getMatchRequirement(password, passwordConfirmation)
      })
    }
  }
  const handleConfirmationBlur = () => {
    if (passwordConfirmation) {
      setRequirements({
        ...requirements,
        match:
          password === ''
            ? 'default'
            : getMatchRequirement(password, passwordConfirmation)
      })
    }
  }

  const fulfillsRequirements = () =>
    Object.keys(requirements).every((req) => requirements[req] === 'valid')

  const handleSubmit = () => {
    if (fulfillsRequirements()) {
      onSubmit(password)
    }
  }

  const pwdChecks = [
    { status: requirements.number, label: messages.checks.number },
    { status: requirements.length, label: messages.checks.length },
    { status: requirements.common, label: messages.checks.common },
    { status: requirements.match, label: messages.checks.match }
  ]
  const isValid = Object.keys(requirements).every(
    (req) => requirements[req] === 'valid'
  )

  return (
    <View style={{ width: '100%' }}>
      <TextInput
        style={styles.input}
        placeholder={messages.passwordPlaceholder}
        value={password}
        onChangeText={handlePasswordChange}
        onBlur={handlePasswordBlur}
        textContentType='password'
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder={messages.confirmationPlaceholder}
        value={passwordConfirmation}
        onChangeText={handlePasswordConfirmationChange}
        onBlur={handleConfirmationBlur}
        textContentType='password'
        secureTextEntry
      />
      <View style={styles.checkContainer}>
        {pwdChecks.map((check, i) => (
          <StatusMessage
            key={`Check_${i}`}
            status={check.status}
            label={check.label}
          />
        ))}
      </View>
      <Button
        styles={{
          button: [
            styles.button,
            { backgroundColor: !isValid || isLoading ? neutralLight4 : primary }
          ]
        }}
        fullWidth
        disabled={!isValid || isLoading}
        onPress={handleSubmit}
        icon={isLoading ? LoadingSpinner : IconArrow}
        iconPosition='right'
        title={submitButtonText}
      />
    </View>
  )
}
