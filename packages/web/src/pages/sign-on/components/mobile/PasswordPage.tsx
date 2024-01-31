import { useState, useCallback } from 'react'

import { commonPasswordCheck } from '@audius/common/utils'
import { Button, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'

import Input from 'components/data-entry/Input'
import { StatusMessage } from 'components/status-message/StatusMessage'
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from 'utils/route'

import styles from './PasswordPage.module.css'

const messages = {
  header: 'Create A Password That Is Secure And Easy To Remember!',
  warning:
    'We can’t reset your password if you forget it. Write it down or use a password manager.',
  checks: [
    'Must contain numbers',
    'Length must be at least 8 characters',
    'Passwords match',
    'Hard to guess'
  ],
  commonPwd: 'Please choose a less common password',
  termsAndPrivacy:
    'By clicking continue, you state you have read and agree to Audius',
  terms: 'Terms of Use',
  and: 'and',
  privacy: 'Privacy Policy.'
}

const MIN_PASSWORD_LEN = 8

export enum CheckState {
  ERROR = 'error',
  DEFAULT = 'default',
  VALID = 'success'
}

const getNumberRequirement = (pwd: string) => {
  if (pwd.length === 0) return CheckState.DEFAULT
  if (!/\d/.test(pwd)) return CheckState.ERROR
  return CheckState.VALID
}

const getLenRequirement = (pwd: string) => {
  if (pwd.length === 0) return CheckState.DEFAULT
  if (pwd.length < MIN_PASSWORD_LEN) return CheckState.ERROR
  return CheckState.VALID
}

const getMatchRequirement = (pwd: string, confirm: string) => {
  if (pwd.length === 0) return CheckState.DEFAULT
  if (pwd !== confirm) return CheckState.ERROR
  return CheckState.VALID
}

const getCommonPasswordCheck = async (pwd: string) => {
  if (pwd.length < MIN_PASSWORD_LEN) return CheckState.DEFAULT
  if (await commonPasswordCheck(pwd)) return CheckState.ERROR
  return CheckState.VALID
}

type PasswordPageProps = {
  email: any
  inputStatus: any
  password: any
  onNextPage: () => void
  onPasswordChange: (password: string) => void
  onTermsOfServiceClick: () => void
  onPrivacyPolicyClick: () => void
}

const PasswordPage = ({
  email,
  inputStatus,
  onPasswordChange,
  onNextPage,
  onTermsOfServiceClick,
  onPrivacyPolicyClick
}: PasswordPageProps) => {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [requirements, setRequirements] = useState({
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
          passwordConfirm === ''
            ? CheckState.DEFAULT
            : getMatchRequirement(password, passwordConfirm)
      }))
    }
  }, [password, passwordConfirm, setRequirements])

  const onPasswordConfirmBlur = useCallback(() => {
    // When the password blurs, check if the number and length req are met
    if (password && passwordConfirm) {
      setRequirements((requirements) => ({
        ...requirements,
        match: getMatchRequirement(password, passwordConfirm)
      }))
    }
  }, [password, passwordConfirm])

  const handlePasswordChange = (password: string) => {
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
    setRequirements((requirements) => ({
      ...requirements,
      number,
      length,
      common,
      match:
        passwordConfirm === ''
          ? CheckState.DEFAULT
          : getMatchRequirement(password, passwordConfirm)
    }))
  }, [requirements, passwordConfirm, setRequirements, password])

  const onPasswordConfirmChange = useCallback(
    (passwordConfirm: string) => {
      setPasswordConfirm(passwordConfirm)
      if (requirements.match !== CheckState.DEFAULT) {
        setRequirements((requirements) => ({
          ...requirements,
          match:
            passwordConfirm === ''
              ? CheckState.DEFAULT
              : getMatchRequirement(password, passwordConfirm)
        }))
      } else if (password.length <= passwordConfirm.length) {
        setRequirements((requirements) => ({
          ...requirements,
          match: getMatchRequirement(password, passwordConfirm)
        }))
      } else {
        setPasswordConfirm(passwordConfirm)
      }
    },
    [requirements, password, setPasswordConfirm, setRequirements]
  )

  const fulfillsRequirements = useCallback(
    () =>
      Object.keys(requirements).every(
        (req) => (requirements as any)[req] === CheckState.VALID
      ),
    [requirements]
  )

  const onClickContinue = useCallback(async () => {
    if (fulfillsRequirements()) {
      await onPasswordChange(password)
      onNextPage()
    }
  }, [fulfillsRequirements, onPasswordChange, password, onNextPage])

  onTermsOfServiceClick = () => {
    const win = window.open(TERMS_OF_SERVICE, '_blank') as Window
    win.focus()
  }

  onPrivacyPolicyClick = () => {
    const win = window.open(PRIVACY_POLICY, '_blank') as Window
    win.focus()
  }

  const pwdChecks = [
    { status: requirements.number, label: messages.checks[0] },
    { status: requirements.length, label: messages.checks[1] },
    { status: requirements.common, label: messages.checks[3] },
    { status: requirements.match, label: messages.checks[2] }
  ]
  const isValid = Object.keys(requirements).every(
    (req) => (requirements as any)[req] === CheckState.VALID
  )
  const hasError = Object.keys(requirements).some(
    (req) => (requirements as any)[req] === CheckState.ERROR
  )

  return (
    <div className={cn(styles.container)}>
      <div className={styles.header}>{messages.header}</div>
      <div className={styles.warning}>{messages.warning}</div>
      <div className={styles.passwordContainer}>
        <Input
          value={email.value}
          autoComplete='username'
          className={styles.hiddenEmailInput}
        />
        <Input
          placeholder='Password'
          size='medium'
          type='password'
          name='password'
          id='password-input'
          autoComplete='new-password'
          value={password}
          variant={'normal'}
          onChange={handlePasswordChange}
          className={cn(styles.passwordInput, {
            [styles.placeholder]: password === '',
            [styles.inputError]: inputStatus === CheckState.ERROR,
            [styles.validInput]: inputStatus === CheckState.VALID
          })}
          error={hasError}
          onBlur={onPasswordBlur}
        />
        <Input
          placeholder='Confirm Password'
          size='medium'
          type='password'
          name='confirmPassword'
          id='confirm-password-input'
          autoComplete='new-password'
          value={passwordConfirm}
          variant={'normal'}
          onChange={onPasswordConfirmChange}
          className={cn(styles.passwordInput, {
            [styles.placeholder]: passwordConfirm === '',
            [styles.inputError]: inputStatus === CheckState.ERROR,
            [styles.validInput]: inputStatus === CheckState.VALID
          })}
          error={hasError}
          onBlur={onPasswordConfirmBlur}
        />
      </div>
      <div className={styles.pwdCheckContainer}>
        {pwdChecks.map((check, ind) => (
          <StatusMessage
            key={ind}
            containerClassName={styles.statusContainer}
            status={check.status}
            label={check.label}
          />
        ))}
      </div>
      <div className={styles.termsAndPrivacy}>
        {messages.termsAndPrivacy}
        <span className={styles.link} onClick={onTermsOfServiceClick}>
          {messages.terms}
        </span>
        {messages.and}
        <span className={styles.link} onClick={onPrivacyPolicyClick}>
          {messages.privacy}
        </span>
      </div>
      <Button
        text='Continue'
        name='continue'
        rightIcon={<IconArrow />}
        type={isValid ? ButtonType.PRIMARY_ALT : ButtonType.DISABLED}
        onClick={onClickContinue}
        className={styles.continueButton}
        textClassName={styles.continueButtonText}
      />
    </div>
  )
}

PasswordPage.defaultProps = {
  inputStatus: CheckState.DEFAULT
}

export default PasswordPage
