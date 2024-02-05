import { useCallback, useState } from 'react'

import { commonPasswordCheck } from '@audius/common/utils'
import { IconArrowRight as IconArrow } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import Input from 'components/data-entry/Input'
import { StatusMessage } from 'components/status-message/StatusMessage'
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from 'utils/route'

import styles from './PasswordPage.module.css'

const messages = {
  header: 'Create A Password That Is Secure And Easy To Remember!',
  warning: {
    desktop: 'We strongly recommend using a password manager.',
    mobile: 'Write it down or use a password manager.'
  },
  checks: [
    'Must contain numbers',
    'Length must be at least 8 characters',
    'Passwords match',
    'Hard to guess'
  ],
  commonPwd: 'Please choose a less common password',
  termsAndPrivacy:
    "By clicking continue, you state you have read and agree to Audius'",
  terms: 'Terms of Use',
  and: 'and',
  privacy: 'Privacy Policy.'
}

const MIN_PASSWORD_LEN = 8

export const checkState = Object.freeze({
  ERROR: 'error',
  DEFAULT: 'default',
  VALID: 'success'
})

const getNumberRequirement = (pwd) => {
  if (pwd.length === 0) return checkState.DEFAULT
  if (!/\d/.test(pwd)) return checkState.ERROR
  return checkState.VALID
}

const getLenRequirement = (pwd) => {
  if (pwd.length === 0) return checkState.DEFAULT
  if (pwd.length < MIN_PASSWORD_LEN) return checkState.ERROR
  return checkState.VALID
}

const getMatchRequirement = (pwd, confirm) => {
  if (pwd.length === 0) return checkState.DEFAULT
  if (pwd !== confirm) return checkState.ERROR
  return checkState.VALID
}

const getCommonPasswordCheck = async (pwd) => {
  if (pwd.length < MIN_PASSWORD_LEN) return checkState.DEFAULT
  if (await commonPasswordCheck(pwd)) return checkState.ERROR
  return checkState.VALID
}

export const PasswordPage = ({
  isMobile,
  onPasswordChange,
  onNextPage,
  inputStatus,
  email
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [requirements, setRequirements] = useState({
    number: checkState.DEFAULT,
    length: checkState.DEFAULT,
    match: checkState.DEFAULT,
    common: checkState.DEFAULT
  })

  const onPasswordBlur = async () => {
    // When the password blurs, check if the number and length req are met
    if (password) {
      const commonCheck = await getCommonPasswordCheck(password)
      setRequirements((requirements) => ({
        ...requirements,
        number: getNumberRequirement(password),
        length: getLenRequirement(password),
        common: commonCheck,
        match:
          passwordConfirm === ''
            ? checkState.DEFAULT
            : getMatchRequirement(password, passwordConfirm)
      }))
    }
  }

  const onPasswordConfirmBlur = () => {
    // When the password confirm blurs, check if the match req is met
    if (password && passwordConfirm) {
      setRequirements((requirements) => ({
        ...requirements,
        match: getMatchRequirement(password, passwordConfirm)
      }))
    }
  }

  const handlePasswordChange = (password) => {
    setPassword(password)
    validatePassword()
  }

  const validatePassword = useCallback(async () => {
    const number =
      requirements.number === checkState.DEFAULT
        ? getNumberRequirement(password) === checkState.VALID
          ? checkState.VALID
          : checkState.DEFAULT
        : getNumberRequirement(password)
    const length =
      requirements.length === checkState.DEFAULT
        ? getLenRequirement(password) === checkState.VALID
          ? checkState.VALID
          : checkState.DEFAULT
        : getLenRequirement(password)
    const common =
      requirements.common === checkState.DEFAULT
        ? (await getCommonPasswordCheck(password)) === checkState.VALID
          ? checkState.VALID
          : checkState.DEFAULT
        : await getCommonPasswordCheck(password)
    setRequirements((requirements) => ({
      ...requirements,
      number,
      length,
      common,
      match:
        passwordConfirm === ''
          ? checkState.DEFAULT
          : getMatchRequirement(password, passwordConfirm)
    }))
  }, [password, passwordConfirm, requirements])

  const onPasswordConfirmChange = (passwordConfirm) => {
    setPasswordConfirm(passwordConfirm)
    if (
      requirements.match !== checkState.DEFAULT ||
      password.length <= passwordConfirm.length
    ) {
      setRequirements((requirements) => ({
        ...requirements,
        match:
          passwordConfirm === ''
            ? checkState.DEFAULT
            : getMatchRequirement(password, passwordConfirm)
      }))
    }
  }

  const onClickContinue = async () => {
    if (fulfillsRequirements() && !isSubmitted) {
      await onPasswordChange(password)
      onNextPage()
      setIsSubmitted(true)
    }
  }

  const onConfirmKeyDown = (e) => {
    if (e.key === 'Enter') onClickContinue()
  }

  const fulfillsRequirements = () =>
    Object.keys(requirements).every(
      (req) => requirements[req] === checkState.VALID
    )

  const onTermsOfServiceClick = () => {
    const win = window.open(TERMS_OF_SERVICE, '_blank')
    win.focus()
  }

  const onPrivacyPolicyClick = () => {
    const win = window.open(PRIVACY_POLICY, '_blank')
    win.focus()
  }

  const pwdChecks = [
    { status: requirements.number, label: messages.checks[0] },
    { status: requirements.length, label: messages.checks[1] },
    { status: requirements.common, label: messages.checks[3] },
    { status: requirements.match, label: messages.checks[2] }
  ]
  const isValid = Object.keys(requirements).every(
    (req) => requirements[req] === checkState.VALID
  )
  const hasError = Object.keys(requirements).some(
    (req) => requirements[req] === checkState.ERROR
  )

  return (
    <div
      className={cn(styles.container, {
        [styles.isMobile]: isMobile
      })}
    >
      <h2 className={styles.header}>{messages.header}</h2>
      <div className={styles.warning}>
        <p className={styles.text}>
          {isMobile ? messages.warning.mobile : messages.warning.desktop}
        </p>
      </div>
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
          variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
          onChange={handlePasswordChange}
          className={cn(styles.passwordInput, {
            [styles.placeholder]: password === '',
            [styles.inputError]: inputStatus === checkState.ERROR,
            [styles.validInput]: inputStatus === checkState.VALID
          })}
          error={hasError}
          onBlur={onPasswordBlur}
        />
        <Input
          placeholder='Confirm Password'
          size='medium'
          type='password'
          name='variantconfirmPassword'
          id='confirm-password-input'
          autoComplete='new-password'
          value={passwordConfirm}
          variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
          onChange={onPasswordConfirmChange}
          onKeyDown={onConfirmKeyDown}
          className={cn(styles.passwordInput, {
            [styles.placeholder]: passwordConfirm === '',
            [styles.inputError]: inputStatus === checkState.ERROR,
            [styles.validInput]: inputStatus === checkState.VALID
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
        disabled={!isValid}
        onClick={onClickContinue}
        className={styles.continueButton}
        textClassName={styles.continueButtonText}
      />
    </div>
  )
}

PasswordPage.propTypes = {
  isMobile: PropTypes.bool,
  onNextPage: PropTypes.func,
  onPasswordChange: PropTypes.func
}

PasswordPage.defaultProps = {
  inputStatus: checkState.DEFAULT
}

export default PasswordPage
