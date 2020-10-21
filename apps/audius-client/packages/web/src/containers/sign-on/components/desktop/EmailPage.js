import React, { Component } from 'react'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { Spring } from 'react-spring/renderprops'
import { Button, ButtonType, IconArrow } from '@audius/stems'

import styles from './EmailPage.module.css'
import { MetaMaskOption } from './MetaMaskOption'
import Input from 'components/data-entry/Input'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import StatusMessage from 'components/general/StatusMessage'
import PreloadImage from 'components/preload-image/PreloadImage'

const messages = {
  title: 'Sign Up For Audius',
  header1: 'Stream the music you love.',
  header2: 'Support the artists you care about.'
}

export const statusState = Object.freeze({
  ERROR: 'ERROR',
  DEFAULT: 'DEFAULT',
  VALID: 'VALID'
})

const errorMessages = {
  characters: 'Please enter a valid email',
  inUse: 'Email is already in use, please sign-in'
}

export class EmailPage extends Component {
  state = {
    attempted: false,
    isSubmitted: false
  }

  onEmailChange = email => {
    this.props.onEmailChange(email)
  }

  onBlur = () => {
    this.setState({ attempted: true })
  }

  onKeyDown = e => {
    if (e.keyCode === 13 /** enter */) {
      this.onSubmit()
    }
  }

  onSubmit = () => {
    const { onNextPage } = this.props
    this.setState({ attempted: true })
    if (!this.props.email.value)
      this.props.onEmailChange(this.props.email.value)
    if (this.props.email.status === 'success' && !this.state.isSubmitted) {
      onNextPage()
      this.setState({ isSubmitted: true })
    }
  }

  onToggleMetaMaskModal = () => {
    const { email, onToggleMetaMaskModal } = this.props
    this.props.onEmailChange(email.value)
    this.setState({ attempted: true })
    if (email.status === 'success') {
      onToggleMetaMaskModal()
    }
  }

  render() {
    const { email, hasMetaMask, isMobile } = this.props
    const { attempted } = this.state
    const inputError = email.status === 'failure'
    const validInput = email.status === 'success'
    const showError =
      (inputError && email.error === 'inUse') || (inputError && attempted)
    return (
      <div
        className={cn(styles.container, {
          [styles.metaMask]: hasMetaMask,
          [styles.isMobile]: isMobile
        })}
      >
        <PreloadImage
          src={audiusLogoColored}
          alt='Audius Colored Logo'
          className={styles.logo}
        />
        <div className={cn(styles.title)}>{messages.title}</div>
        <div className={cn(styles.header)}>
          <div className={styles.text}>{messages.header1}</div>
          <div className={styles.text}>{messages.header2}</div>
        </div>
        <Input
          placeholder='Email'
          type='email'
          name='email'
          variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
          size='medium'
          value={email.value}
          onChange={this.onEmailChange}
          onKeyDown={this.onKeyDown}
          className={cn(styles.signInInput, {
            [styles.placeholder]: email.value === '',
            [styles.inputError]: showError,
            [styles.validInput]: validInput
          })}
          error={showError}
          onBlur={this.onBlur}
        />
        {showError ? (
          <Spring
            from={{ opacity: 0 }}
            to={{ opacity: 1 }}
            config={{ duration: 200 }}
          >
            {animProps => (
              <StatusMessage
                status='error'
                label={errorMessages[email.error]}
                containerStyle={animProps}
                containerClassName={cn(styles.errorMessage, {
                  [styles.errMetaMask]: hasMetaMask
                })}
              />
            )}
          </Spring>
        ) : null}
        <Button
          text='Continue'
          name='continue'
          rightIcon={<IconArrow />}
          type={ButtonType.PRIMARY_ALT}
          onClick={this.onSubmit}
          textClassName={styles.signInButtonText}
          className={styles.signInButton}
        />
        <div
          className={cn(styles.hasAccount, {
            [styles.hasAccountErrMetaMask]: hasMetaMask && showError,
            [styles.hasAccountErr]: !hasMetaMask && showError
          })}
        >
          Already have an account?{' '}
          <span className={styles.signInText} onClick={this.props.onSignIn}>
            Sign In
          </span>
        </div>
        {hasMetaMask ? (
          <MetaMaskOption
            text='Sign Up With'
            subText='not recommended'
            onClick={this.onToggleMetaMaskModal}
          />
        ) : null}
      </div>
    )
  }
}

EmailPage.propTypes = {
  isMobile: PropTypes.bool,
  hasMetaMask: PropTypes.bool,
  email: PropTypes.shape({
    value: PropTypes.string,
    status: PropTypes.string,
    error: PropTypes.string
  }),
  onNextPage: PropTypes.func,
  onEmailChange: PropTypes.func,
  onToggleMetaMaskModal: PropTypes.func
}

EmailPage.defaultProps = {
  isMobile: false,
  hasMetaMask: false,
  email: {
    value: '',
    error: '',
    status: 'editing'
  }
}

export default EmailPage
