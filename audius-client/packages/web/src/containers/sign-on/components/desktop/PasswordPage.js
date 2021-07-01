import React, { Component } from 'react'

import { Button, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'
import commonPasswordList from 'fxa-common-password-list'
import PropTypes from 'prop-types'

import Input from 'components/data-entry/Input'
import StatusMessage from 'components/general/StatusMessage'
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

const getNumberRequirement = pwd => {
  if (pwd.length === 0) return checkState.DEFAULT
  if (!/\d/.test(pwd)) return checkState.ERROR
  return checkState.VALID
}

const getLenRequirement = pwd => {
  if (pwd.length === 0) return checkState.DEFAULT
  if (pwd.length < MIN_PASSWORD_LEN) return checkState.ERROR
  return checkState.VALID
}

const getMatchRequirement = (pwd, confirm) => {
  if (pwd.length === 0) return checkState.DEFAULT
  if (pwd !== confirm) return checkState.ERROR
  return checkState.VALID
}

const getCommonPasswordCheck = pwd => {
  if (pwd.length < MIN_PASSWORD_LEN) return checkState.DEFAULT
  if (commonPasswordList.test(pwd)) return checkState.ERROR
  return checkState.VALID
}

window.pwdText = commonPasswordList

export class PasswordPage extends Component {
  state = {
    isSubmitted: false,
    password: '',
    passwordConfirm: '',
    requirements: {
      number: checkState.DEFAULT,
      length: checkState.DEFAULT,
      match: checkState.DEFAULT,
      common: checkState.DEFAULT
    }
  }

  onPasswordBlur = () => {
    // When the password blurs, check if the number and length req are met
    const { password, passwordConfirm, requirements } = this.state
    if (password) {
      this.setState({
        requirements: {
          ...requirements,
          number: getNumberRequirement(password),
          length: getLenRequirement(password),
          common: getCommonPasswordCheck(password),
          match:
            passwordConfirm === ''
              ? checkState.DEFAULT
              : getMatchRequirement(password, passwordConfirm)
        }
      })
    }
  }

  onPasswordConfirmBlur = () => {
    // When the password blurs, check if the number and length req are met
    const { password, passwordConfirm, requirements } = this.state
    if (password && passwordConfirm) {
      this.setState({
        requirements: {
          ...requirements,
          match: getMatchRequirement(password, passwordConfirm)
        }
      })
    }
  }

  onPasswordChange = password => {
    const { requirements, passwordConfirm } = this.state
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
        ? getCommonPasswordCheck(password) === checkState.VALID
          ? checkState.VALID
          : checkState.DEFAULT
        : getCommonPasswordCheck(password)
    this.setState({
      password,
      requirements: {
        ...requirements,
        number,
        length,
        common,
        match:
          passwordConfirm === ''
            ? checkState.DEFAULT
            : getMatchRequirement(password, passwordConfirm)
      }
    })
  }

  onPasswordConfirmChange = passwordConfirm => {
    const { requirements, password } = this.state
    if (requirements.match !== checkState.DEFAULT) {
      this.setState({
        passwordConfirm,
        requirements: {
          ...requirements,
          match:
            passwordConfirm === ''
              ? checkState.DEFAULT
              : getMatchRequirement(password, passwordConfirm)
        }
      })
    } else if (password.length <= passwordConfirm.length) {
      this.setState({
        passwordConfirm,
        requirements: {
          ...requirements,
          match: getMatchRequirement(password, passwordConfirm)
        }
      })
    } else {
      this.setState({ passwordConfirm })
    }
  }

  onClickContinue = () => {
    const { password } = this.state
    if (this.fulfillsRequirements() && !this.state.isSubmitted) {
      this.props.onPasswordChange(password)
      this.props.onNextPage()
      this.setState({ isSubmitted: true })
    }
  }

  onConfirmKeyDown = e => {
    if (e.keyCode === 13 /** enter */) {
      this.onClickContinue()
    }
  }

  fulfillsRequirements = () =>
    Object.keys(this.state.requirements).every(
      req => this.state.requirements[req] === checkState.VALID
    )

  onTermsOfServiceClick = () => {
    const win = window.open(TERMS_OF_SERVICE, '_blank')
    win.focus()
  }

  onPrivacyPolicyClick = () => {
    const win = window.open(PRIVACY_POLICY, '_blank')
    win.focus()
  }

  render() {
    const { password, passwordConfirm, requirements } = this.state
    const { isMobile, inputStatus } = this.props

    const pwdChecks = [
      { status: requirements.number, label: messages.checks[0] },
      { status: requirements.length, label: messages.checks[1] },
      { status: requirements.common, label: messages.checks[3] },
      { status: requirements.match, label: messages.checks[2] }
    ]
    const isValid = Object.keys(requirements).every(
      req => requirements[req] === checkState.VALID
    )
    const hasError = Object.keys(requirements).some(
      req => requirements[req] === checkState.ERROR
    )

    return (
      <div
        className={cn(styles.container, {
          [styles.isMobile]: isMobile
        })}
      >
        <div className={styles.header}>{messages.header}</div>
        <div className={styles.warning}>
          <div className={styles.text}>
            {isMobile ? messages.warning.mobile : messages.warning.desktop}
          </div>
        </div>
        <div className={styles.passwordContainer}>
          <Input
            value={this.props.email.value}
            autoComplete='username'
            className={styles.hiddenEmailInput}
          />
          <Input
            placeholder='Password'
            size='medium'
            type='password'
            name='password'
            autoComplete='new-password'
            value={password}
            variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
            onChange={this.onPasswordChange}
            className={cn(styles.passwordInput, {
              [styles.placeholder]: password === '',
              [styles.inputError]: inputStatus === checkState.ERROR,
              [styles.validInput]: inputStatus === checkState.VALID
            })}
            error={hasError}
            onBlur={this.onPasswordBlur}
          />
          <Input
            placeholder='Confirm Password'
            size='medium'
            type='password'
            name='confirmPassword'
            autoComplete='new-password'
            value={passwordConfirm}
            variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
            onChange={this.onPasswordConfirmChange}
            onKeyDown={this.onConfirmKeyDown}
            className={cn(styles.passwordInput, {
              [styles.placeholder]: passwordConfirm === '',
              [styles.inputError]: inputStatus === checkState.ERROR,
              [styles.validInput]: inputStatus === checkState.VALID
            })}
            error={hasError}
            onBlur={this.onPasswordConfirmBlur}
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
          <span className={styles.link} onClick={this.onTermsOfServiceClick}>
            {messages.terms}
          </span>
          {messages.and}
          <span className={styles.link} onClick={this.onPrivacyPolicyClick}>
            {messages.privacy}
          </span>
        </div>
        <Button
          text='Continue'
          name='continue'
          rightIcon={<IconArrow />}
          type={isValid ? ButtonType.PRIMARY_ALT : ButtonType.DISABLED}
          onClick={this.onClickContinue}
          className={styles.continueButton}
          textClassName={styles.continueButtonText}
        />
      </div>
    )
  }
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
