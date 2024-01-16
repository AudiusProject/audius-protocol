import {
  createRef,
  useState,
  useEffect,
  useCallback,
  KeyboardEvent
} from 'react'

import { useInstanceVar } from '@audius/common'
import { Button, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { Spring } from 'react-spring/renderprops.cjs'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import Input from 'components/data-entry/Input'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import PreloadImage from 'components/preload-image/PreloadImage'
import { StatusMessage } from 'components/status-message/StatusMessage'

import { ForgotPasswordHelper } from './ForgotPasswordHelper'
import { MetaMaskOption } from './MetaMaskOption'
import styles from './SignInPage.module.css'

const messages = {
  title: 'Sign Into Your Audius Account',
  error: {
    inUse: 'Invalid password',
    requiresOtp: 'Enter the verification code sent to your email',
    default: 'Invalid Credentials'
  },
  forgotPasswordText: 'Forgot your password?'
}

type emailStatus = 'editing' | 'failure' | 'loading' | 'success'
type passwordStatus = 'editing' | 'failure' | 'loading'
type otpStatus = 'editing' | 'failure'

type SignInProps = {
  isMobile: boolean
  loading: boolean
  hasMetaMask: boolean
  email: {
    value: string
    error: string
    status: emailStatus
  }
  password: {
    value: string
    error: string
    status: passwordStatus
  }
  otp: {
    value: string
    error: string
    status: otpStatus
  }
  onEmailChange: (email: string, validate?: boolean) => void
  onPasswordChange: (password: string) => void
  onOtpChange: (password: string) => void
  onSignIn: (email: string, password: string) => void
  onSignUp: () => void
  onMetaMaskSignIn: () => void
}

export const SignInPage = ({
  isMobile,
  loading,
  hasMetaMask,
  email,
  password,
  otp,
  onPasswordChange,
  onEmailChange,
  onOtpChange,
  onSignIn,
  onSignUp,
  onMetaMaskSignIn
}: SignInProps) => {
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [getInitialEmail] = useInstanceVar(email)

  const passwordInput = createRef<HTMLInputElement>()

  useEffect(() => {
    const email = getInitialEmail()
    if (email && email.value) {
      passwordInput.current?.focus()
    }
  }, [getInitialEmail, passwordInput])

  const onEmailKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        passwordInput.current?.focus()
      }
    },
    [passwordInput]
  )

  const onPwdKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onSignIn(email.value, password.value)
      }
    },
    [email, password, onSignIn]
  )

  const onSignInWithMetaMask = async () => {
    try {
      window.localStorage.setItem('useMetaMask', JSON.stringify(true))
      onMetaMaskSignIn()
    } catch (err) {
      console.error({ err })
    }
  }

  const signInError = password.error
  const requiresOtp = signInError.includes('403')

  let errorMessage: string
  if (email.error === 'inUse') {
    errorMessage = messages.error.inUse
  } else if (requiresOtp) {
    errorMessage = messages.error.requiresOtp
  } else {
    errorMessage = messages.error.default
  }

  return (
    <div
      className={cn(styles.container, {
        [styles.isMobile]: isMobile,
        [styles.signInError]: signInError,
        [styles.metaMask]: hasMetaMask
      })}
    >
      <PreloadImage
        src={audiusLogoColored}
        className={styles.logo}
        alt='Audius Colored Logo'
      />
      {!hasMetaMask && <div className={styles.title}>{messages.title}</div>}
      <select style={{ display: 'none' }} />
      <Input
        placeholder='Email'
        size='medium'
        type='email'
        name='email'
        id='email-input'
        autoComplete='username'
        value={email.value}
        variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
        onChange={onEmailChange}
        onKeyDown={onEmailKeyDown}
        className={cn(styles.signInInput, {
          [styles.hasMetaMask]: hasMetaMask
        })}
      />
      <Input
        placeholder='Password'
        size='medium'
        name='password'
        id='password-input'
        autoComplete='current-password'
        inputRef={passwordInput}
        value={password.value}
        type='password'
        variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
        onChange={onPasswordChange}
        onKeyDown={onPwdKeyDown}
        className={cn(styles.signInInput)}
      />
      {signInError && (
        <Spring
          from={{ opacity: 0 }}
          to={{ opacity: 1 }}
          config={{ duration: 1000 }}
        >
          {(animProps) => (
            <StatusMessage
              status='error'
              containerStyle={animProps}
              containerClassName={styles.errorContainer}
              label={errorMessage}
            />
          )}
        </Spring>
      )}
      {requiresOtp ? (
        <Input
          placeholder='Verification Code'
          size='medium'
          name='otp'
          id='otp-input'
          value={otp.value}
          characterLimit={6}
          type='number'
          variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
          onChange={onOtpChange}
          className={cn(styles.signInInput)}
        />
      ) : null}
      <div className={styles.buttonsContainer}>
        <Button
          name='sign-in'
          text='Continue'
          rightIcon={
            loading ? (
              <LoadingSpinner className={styles.spinner} />
            ) : (
              <IconArrow />
            )
          }
          type={ButtonType.PRIMARY_ALT}
          onClick={() => onSignIn(email.value, password.value)}
          textClassName={styles.signInButtonText}
          className={styles.signInButton}
        />
        {hasMetaMask && !requiresOtp ? (
          <MetaMaskOption text='Sign In With' onClick={onSignInWithMetaMask} />
        ) : null}
        <div className={styles.createAccount}>
          <Button
            text={'New to Audius? Create an Account'}
            type={ButtonType.COMMON_ALT}
            onClick={onSignUp}
          />
        </div>
        <div className={styles.forgotPasswordTextContainer}>
          <span
            onClick={() => {
              setShowForgotPassword(true)
            }}
            className={styles.forgotPasswordText}
          >
            {messages.forgotPasswordText}
          </span>
        </div>
        <ForgotPasswordHelper
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </div>
    </div>
  )
}
