import { useCallback, useState } from 'react'

import { Button, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'

import Input from 'components/data-entry/Input'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { StatusMessage } from 'components/status-message/StatusMessage'
import { commonPasswordCheck } from 'utils/commonPasswordCheck'

import styles from './EnterPassword.module.css'

const MIN_PASSWORD_LEN = 8

const messages = {
  checks: [
    'Must contain numbers',
    'Length must be at least 8 characters',
    'Passwords match',
    'Hard to guess'
  ],
  commonPwd: 'Please choose a less common password'
}

enum CheckState {
  ERROR = 'error',
  DEFAULT = 'default',
  VALID = 'success'
}

const getNumberRequirement = (password: string) => {
  if (password.length === 0) return CheckState.DEFAULT
  if (!/\d/.test(password)) return CheckState.ERROR
  return CheckState.VALID
}

const getLenRequirement = (password: string) => {
  if (password.length === 0) return CheckState.DEFAULT
  if (password.length < MIN_PASSWORD_LEN) return CheckState.ERROR
  return CheckState.VALID
}

const getMatchRequirement = (
  password: string,
  passwordConfirmation: string
) => {
  if (password.length === 0) return CheckState.DEFAULT
  if (password !== passwordConfirmation) return CheckState.ERROR
  return CheckState.VALID
}

const getCommonPasswordCheck = async (password: string) => {
  if (password.length < MIN_PASSWORD_LEN) return CheckState.DEFAULT
  if (await commonPasswordCheck(password)) return CheckState.ERROR
  return CheckState.VALID
}

type EnterPasswordProps = {
  continueLabel: string
  continueIcon?: JSX.Element
  isMobile: boolean
  onSubmit: (password: string) => void
  isLoading?: boolean
}

type Requirements = {
  number: CheckState
  length: CheckState
  match: CheckState
  common: CheckState
  [key: string]: CheckState
}

const EnterPassword = ({
  continueLabel,
  continueIcon,
  isMobile,
  onSubmit,
  isLoading
}: EnterPasswordProps) => {
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [requirements, setRequirements] = useState<Requirements>({
    number: CheckState.DEFAULT,
    length: CheckState.DEFAULT,
    match: CheckState.DEFAULT,
    common: CheckState.DEFAULT
  })

  const onPasswordBlur = useCallback(async () => {
    const commonCheck = await getCommonPasswordCheck(password)

    // When the password blurs, check if the number and length req are met
    if (password) {
      setRequirements((requirements) => ({
        ...requirements,
        number: getNumberRequirement(password),
        length: getLenRequirement(password),
        common: commonCheck,
        match:
          passwordConfirmation === ''
            ? CheckState.DEFAULT
            : getMatchRequirement(password, passwordConfirmation)
      }))
    }
  }, [password, passwordConfirmation])

  const onPasswordConfirmationBlur = useCallback(() => {
    // When the password blurs, check if the number and length req are met
    if (password && passwordConfirmation) {
      setRequirements((requirements) => ({
        ...requirements,
        match: getMatchRequirement(password, passwordConfirmation)
      }))
    }
  }, [password, passwordConfirmation])

  const onPasswordChange = (password: string) => {
    setPassword(password)
    validatePassword()
  }

  const validatePassword = useCallback(async () => {
    const number =
      requirements.number === CheckState.DEFAULT
        ? getNumberRequirement(password) === CheckState.VALID
          ? CheckState.VALID
          : CheckState.DEFAULT
        : getNumberRequirement(password)
    const length =
      requirements.length === CheckState.DEFAULT
        ? getLenRequirement(password) === CheckState.VALID
          ? CheckState.VALID
          : CheckState.DEFAULT
        : getLenRequirement(password)
    const common =
      requirements.common === CheckState.DEFAULT
        ? (await getCommonPasswordCheck(password)) === CheckState.VALID
          ? CheckState.VALID
          : CheckState.DEFAULT
        : await getCommonPasswordCheck(password)
    setRequirements({
      ...requirements,
      number,
      length,
      common,
      match:
        passwordConfirmation === ''
          ? CheckState.DEFAULT
          : getMatchRequirement(password, passwordConfirmation)
    })
  }, [password, passwordConfirmation, requirements])

  const onPasswordConfirmationChange = (passwordConfirmation: string) => {
    if (requirements.match !== CheckState.DEFAULT) {
      setRequirements({
        ...requirements,
        match:
          passwordConfirmation === ''
            ? CheckState.DEFAULT
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

  const fulfillsRequirements = () =>
    Object.keys(requirements).every(
      (req) => requirements[req] === CheckState.VALID
    )

  const onClickSubmit = () => {
    if (fulfillsRequirements()) {
      onSubmit(password)
    }
  }

  const onConfirmKeyDown = (e: KeyboardEvent) => {
    if (e.keyCode === 13 /** enter */) {
      onClickSubmit()
    }
  }

  const pwdChecks = [
    { status: requirements.number, label: messages.checks[0] },
    { status: requirements.length, label: messages.checks[1] },
    { status: requirements.common, label: messages.checks[3] },
    { status: requirements.match, label: messages.checks[2] }
  ]
  const isValid = Object.keys(requirements).every(
    (req) => requirements[req] === CheckState.VALID
  )
  const hasError = Object.keys(requirements).some(
    (req) => requirements[req] === CheckState.ERROR
  )

  return (
    <div className={cn(styles.container, { [styles.isMobile]: isMobile })}>
      <form
        className={styles.form}
        method='post'
        onSubmit={(e) => {
          e.preventDefault()
        }}
        autoComplete='off'
      >
        <div className={styles.passwordContainer}>
          <Input
            placeholder='Password'
            size='medium'
            type='password'
            name='password'
            id='password'
            autoComplete='new-password'
            value={password}
            variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
            onChange={onPasswordChange}
            className={cn(styles.passwordInput, {
              [styles.placeholder]: password === ''
            })}
            error={hasError}
            onBlur={onPasswordBlur}
          />
          <Input
            placeholder='Confirm Password'
            size='medium'
            type='password'
            name='confirmPassword'
            id='confirm-password'
            autoComplete='new-password'
            value={passwordConfirmation}
            variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
            onChange={onPasswordConfirmationChange}
            onKeyDown={onConfirmKeyDown}
            className={cn(styles.passwordInput, {
              [styles.placeholder]: passwordConfirmation === ''
            })}
            error={hasError}
            onBlur={onPasswordConfirmationBlur}
          />
        </div>
      </form>
      <div className={styles.pwdCheckContainer}>
        {pwdChecks.map((check, i) => (
          <StatusMessage
            key={i}
            containerClassName={styles.statusContainer}
            status={check.status}
            label={check.label}
          />
        ))}
      </div>
      <Button
        text={continueLabel}
        name='continue'
        rightIcon={
          isLoading ? (
            <LoadingSpinner className={styles.spinner} />
          ) : (
            continueIcon || <IconArrow />
          )
        }
        type={
          isValid && !isLoading ? ButtonType.PRIMARY_ALT : ButtonType.DISABLED
        }
        onClick={onClickSubmit}
        className={styles.continueButton}
        textClassName={styles.continueButtonText}
      />
    </div>
  )
}

export default EnterPassword
