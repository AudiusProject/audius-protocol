import React, { Component } from 'react'

import { Button, ButtonSize, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'
import { Spring } from 'react-spring/renderprops'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import Input from 'components/data-entry/Input'
import StatusMessage from 'components/general/StatusMessage'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import PreloadImage from 'components/preload-image/PreloadImage'

import styles from './EmailPage.module.css'
import { MetaMaskOption } from './MetaMaskOption'

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

type EmailPageProps = {
  isMobile?: boolean
  hasMetaMask: boolean
  email: {
    value: string
    status: string
    error: 'inUse' | 'characters'
  }
  onSubmit: (email: string) => void
  onEmailChange: (email: string) => void
  onToggleMetaMaskModal: () => void
  onSignIn: () => void
}
type EmailPageState = {
  showValidation: boolean
  isSubmitting: boolean
}

export class EmailPage extends Component<EmailPageProps, EmailPageState> {
  constructor(props: EmailPageProps) {
    super(props)

    this.state = {
      showValidation: false,
      isSubmitting: false
    }
  }

  onEmailChange = (email: string) => {
    this.props.onEmailChange(email)
  }

  onBlur = () => {
    this.setState({ showValidation: true })
  }

  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      this.onSubmit()
    }
  }

  onSubmit = () => {
    const { onSubmit, email } = this.props
    this.setState({ showValidation: true, isSubmitting: true })
    if (!email.value) this.props.onEmailChange(email.value)
    onSubmit(email.value)
  }

  onToggleMetaMaskModal = () => {
    const { email, onToggleMetaMaskModal } = this.props
    this.props.onEmailChange(email.value)
    this.setState({ showValidation: true })
    if (email.status === 'success') {
      onToggleMetaMaskModal()
    }
  }

  componentDidUpdate(newProps: EmailPageProps) {
    if (this.state.isSubmitting && newProps.email.status !== 'loading') {
      this.setState({ isSubmitting: false })
    }
  }

  render() {
    const { email, hasMetaMask, isMobile } = this.props
    const { showValidation, isSubmitting } = this.state
    const inputError = email.status === 'failure'
    const validInput = email.status === 'success'
    const shouldDisableInputs = isSubmitting && email.status === 'loading'
    const showError = inputError && showValidation && email.error !== 'inUse'
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
          disabled={shouldDisableInputs}
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
        <div className={styles.buttonsContainer}>
          <Button
            size={ButtonSize.MEDIUM}
            text='Continue'
            name='continue'
            rightIcon={
              shouldDisableInputs ? (
                <LoadingSpinner className={styles.spinner} />
              ) : (
                <IconArrow />
              )
            }
            type={ButtonType.PRIMARY_ALT}
            onClick={this.onSubmit}
            textClassName={styles.signInButtonText}
            className={styles.signInButton}
            isDisabled={shouldDisableInputs}
          />
          {hasMetaMask ? (
            <MetaMaskOption
              text='Sign Up With'
              subText='not recommended'
              onClick={this.onToggleMetaMaskModal}
            />
          ) : null}
          <div className={styles.hasAccount}>
            <Button
              className={cn(styles.hasAccountButton, {
                [styles.hasAccountErrMetaMask]: hasMetaMask && showError,
                [styles.hasAccountErr]: !hasMetaMask && showError
              })}
              type={ButtonType.COMMON_ALT}
              text={'Have an Account? Sign In'}
              onClick={this.props.onSignIn}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default EmailPage
