import React, { useEffect, useState } from 'react'

import { Button, ButtonSize, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'
import { Spring } from 'react-spring/renderprops'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import Input from 'components/data-entry/Input'
import StatusMessage from 'components/general/StatusMessage'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import PreloadImage from 'components/preload-image/PreloadImage'
import { useDelayedEffect } from 'hooks/useDelayedEffect'

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

export const EmailPage = ({
  isMobile,
  hasMetaMask,
  email,
  onSubmit,
  onEmailChange,
  onToggleMetaMaskModal,
  onSignIn
}: EmailPageProps) => {
  const [showValidation, setShowValidation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onBlur = () => {
    setShowValidation(true)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onClickSubmit()
    }
  }

  const onClickSubmit = () => {
    setShowValidation(true)
    setIsSubmitting(true)
    if (!email.value) onEmailChange(email.value)
    onSubmit(email.value)
  }

  const onClickToggleMetaMaskModal = () => {
    onEmailChange(email.value)
    setShowValidation(true)
    if (email.status === 'success') {
      onToggleMetaMaskModal()
    }
  }

  useEffect(() => {
    if (isSubmitting && email.status !== 'loading') {
      setIsSubmitting(false)
    }
  }, [isSubmitting, email, setIsSubmitting])

  const [shouldShowLoadingSpinner, setShouldShowLoadingSpinner] = useState(
    false
  )
  useDelayedEffect({
    callback: () => setShouldShowLoadingSpinner(true),
    reset: () => setShouldShowLoadingSpinner(false),
    condition: isSubmitting,
    delay: 1000
  })

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
        onChange={onEmailChange}
        onKeyDown={onKeyDown}
        className={cn(styles.signInInput, {
          [styles.placeholder]: email.value === '',
          [styles.inputError]: showError,
          [styles.validInput]: validInput
        })}
        error={showError}
        onBlur={onBlur}
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
            shouldDisableInputs && shouldShowLoadingSpinner ? (
              <LoadingSpinner className={styles.spinner} />
            ) : (
              <IconArrow />
            )
          }
          type={
            shouldDisableInputs ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT
          }
          onClick={onClickSubmit}
          textClassName={styles.signInButtonText}
          className={styles.signInButton}
          isDisabled={shouldDisableInputs}
        />
        {hasMetaMask ? (
          <MetaMaskOption
            text='Sign Up With'
            subText='not recommended'
            onClick={onClickToggleMetaMaskModal}
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
            onClick={onSignIn}
          />
        </div>
      </div>
    </div>
  )
}
