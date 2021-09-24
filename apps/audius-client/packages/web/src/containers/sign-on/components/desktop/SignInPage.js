import React, { PureComponent } from 'react'

import { Button, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { Spring } from 'react-spring/renderprops'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import Input from 'components/data-entry/Input'
import StatusMessage from 'components/general/StatusMessage'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import PreloadImage from 'components/preload-image/PreloadImage'

import { MetaMaskOption } from './MetaMaskOption'
import styles from './SignInPage.module.css'

const messages = {
  title: 'Sign Into Your Audius Account',
  error: {
    inUse: 'Invalid password',
    default: 'Invalid Credentials'
  }
}

export class SignIn extends PureComponent {
  passwordInput = React.createRef()

  onEmailKeyDown = e => {
    if (e.keyCode === 13 /** enter */) {
      this.passwordInput.current.focus()
    }
  }

  onEmailChange = email => {
    this.props.onEmailChange(email, /* validate */ true)
  }

  onPwdKeyDown = e => {
    if (e.keyCode === 13 /** enter */) {
      this.props.onSignIn()
    }
  }

  onSignInWithMetaMask = async () => {
    try {
      window.localStorage.setItem('useMetaMask', JSON.stringify(true))
      await this.props.onMetaMaskSignIn()
    } catch (err) {
      console.error({ err })
    }
  }

  componentDidMount() {
    if (this.props.email && this.props.email.value) {
      this.passwordInput.current.focus()
    }
  }

  render() {
    const {
      isMobile,
      loading,
      email,
      password,
      onPasswordChange,
      onSignIn,
      onSignUp,
      hasMetaMask
    } = this.props

    const signInError = password.error
    const errorMessage =
      messages.error[email.error === 'inUse' ? 'inUse' : 'default']

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
          autoComplete='username'
          value={email.value}
          variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
          onChange={this.onEmailChange}
          onKeyDown={this.onEmailKeyDown}
          className={cn(styles.signInInput, {
            [styles.hasMetaMask]: hasMetaMask
          })}
        />
        <Input
          placeholder='Password'
          size='medium'
          name='password'
          autoComplete='current-password'
          inputRef={this.passwordInput}
          value={password.value}
          type='password'
          variant={isMobile ? 'normal' : 'elevatedPlaceholder'}
          onChange={onPasswordChange}
          onKeyDown={this.onPwdKeyDown}
          className={cn(styles.signInInput, {
            [styles.hasMetaMask]: hasMetaMask
          })}
        />
        {signInError && (
          <Spring
            from={{ opacity: 0 }}
            to={{ opacity: 1 }}
            config={{ duration: 1000 }}
          >
            {animProps => (
              <StatusMessage
                status='error'
                containerStyle={animProps}
                containerClassName={styles.errorContainer}
                label={errorMessage}
              />
            )}
          </Spring>
        )}
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
            onClick={onSignIn}
            textClassName={styles.signInButtonText}
            className={styles.signInButton}
          />
          {hasMetaMask ? (
            <MetaMaskOption
              text='Sign In With'
              onClick={this.onSignInWithMetaMask}
            />
          ) : null}
          <div className={styles.createAccount}>
            <Button
              text={'New to Audius? Create an Account'}
              type={ButtonType.COMMON_ALT}
              onClick={onSignUp}
            />
          </div>
        </div>
      </div>
    )
  }
}

SignIn.propTypes = {
  email: PropTypes.shape({
    value: PropTypes.string,
    error: PropTypes.string,
    status: PropTypes.oneOf(['editing', 'failure', 'loading', 'success'])
  }),
  password: PropTypes.shape({
    value: PropTypes.string,
    error: PropTypes.string,
    status: PropTypes.oneOf(['editing', 'failure', 'loading'])
  }),
  onCloseModal: PropTypes.func,
  onSignIn: PropTypes.func,
  onSignUp: PropTypes.func,
  onMetaMaskSignIn: PropTypes.func,
  isMobile: PropTypes.bool,
  loading: PropTypes.bool,
  hasMetaMask: PropTypes.bool
}

SignIn.defaultProps = {}

export default SignIn
