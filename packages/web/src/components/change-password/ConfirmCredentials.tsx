import { FormEvent, useEffect, useState } from 'react'

import {
  Status,
  changePasswordSelectors,
  changePasswordActions
} from '@audius/common'
import { Button, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { Spring } from 'react-spring/renderprops.cjs'

import Input from 'components/data-entry/Input'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { StatusMessage } from 'components/status-message/StatusMessage'
import { useSelector } from 'utils/reducer'

import styles from './ConfirmCredentials.module.css'
const { getConfirmCredentialsStatus } = changePasswordSelectors
const { confirmCredentials } = changePasswordActions

type ConfirmCredentialsProps = {
  isMobile: boolean
  onComplete: (credentials: { email: string; password: string }) => void
}

const messages = {
  emailPlaceholder: 'Email',
  passwordPlaceholder: 'Current Password',
  continueButtonText: 'Continue',
  error: 'Invalid Credentials'
}

export const ConfirmCredentials = (props: ConfirmCredentialsProps) => {
  const { isMobile, onComplete } = props

  const dispatch = useDispatch()
  const status = useSelector(getConfirmCredentialsStatus)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorSeen, setErrorSeen] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const isSubmitDisabled = status !== Status.ERROR && hasSubmitted

  const onEmailChange = (newEmail: string) => {
    setEmail(newEmail)
  }

  const onPasswordChange = (newPassword: string) => {
    setPassword(newPassword)
  }

  const onKeyDown = () => {
    setErrorSeen(true)
  }

  const onSubmit = () => {
    setErrorSeen(false)
    setHasSubmitted(true)
    dispatch(confirmCredentials({ email, password }))
  }

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
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
  }, [onComplete, setHasSubmitted, hasSubmitted, email, password, status])

  return (
    <form onSubmit={onFormSubmit}>
      <Input
        placeholder={messages.emailPlaceholder}
        size='medium'
        type='email'
        name='email'
        autoComplete='username'
        value={email}
        variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
        onChange={onEmailChange}
        onKeyDown={onKeyDown}
        className={styles.signInInput}
        disabled={status === Status.LOADING}
      />
      <Input
        placeholder={messages.passwordPlaceholder}
        size='medium'
        name='password'
        autoComplete='current-password'
        value={password}
        type='password'
        variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
        onChange={onPasswordChange}
        onKeyDown={onKeyDown}
        className={styles.signInInput}
        disabled={status === Status.LOADING}
      />
      {status === Status.ERROR && !errorSeen && (
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
              label={messages.error}
            />
          )}
        </Spring>
      )}
      <Button
        className={cn(styles.continueButton, { [styles.isMobile]: isMobile })}
        text={messages.continueButtonText}
        rightIcon={
          status === Status.LOADING ? (
            <LoadingSpinner className={styles.spinner} />
          ) : (
            <IconArrow />
          )
        }
        isDisabled={isSubmitDisabled}
        type={isSubmitDisabled ? ButtonType.DISABLED : ButtonType.PRIMARY_ALT}
        onClick={onSubmit}
      />
    </form>
  )
}
