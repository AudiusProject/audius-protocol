import { FormEvent, useLayoutEffect, useState } from 'react'

import { Name, ErrorLevel } from '@audius/common/models'
import { accountSelectors, signOutActions } from '@audius/common/store'
import { IconValidationX } from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import Input from 'components/data-entry/Input'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { ProfileInfo } from 'components/profile-info/ProfileInfo'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { reportToSentry } from 'store/errors/reportToSentry'
import { SIGN_UP_PAGE } from 'utils/route'

import styles from './OAuthLoginPage.module.css'
import { ApproveTransactionScreen } from './components/ApproveTransactionScreen'
import { CTAButton } from './components/CTAButton'
import { ContentWrapper } from './components/ContentWrapper'
import { PermissionsSection } from './components/PermissionsSection'
import { useOAuthSetup } from './hooks'
import { messages } from './messages'
import { WriteOnceTx } from './utils'

const { signOut } = signOutActions
const { getAccountUser } = accountSelectors

export const OAuthLoginPage = () => {
  useLayoutEffect(() => {
    document.body.classList.add(styles.bgWhite)
    return () => {
      document.body.classList.remove(styles.bgWhite)
    }
  }, [])
  const record = useRecord()
  const account = useSelector(getAccountUser)
  const isLoggedIn = Boolean(account)

  const dispatch = useDispatch()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [otpEmail, setOtpEmail] = useState<string | null>(null)
  const [signInError, setSignInError] = useState<string | null>(null)
  const [generalSubmitError, setGeneralSubmitError] = useState<string | null>(
    null
  )
  const [metaMaskTransactionStatus, setMetaMaskTransactionStatus] = useState<
    null | 'pending' | 'approved'
  >(null) // Only applicable when tx = connect_dashboard_wallet

  const clearErrors = () => {
    setGeneralSubmitError(null)
    setSignInError(null)
  }

  const toggleOtpUI = (on: boolean) => {
    if (on) {
      setShowOtpInput(true)
      setSignInError(messages.otpError)
    } else {
      setSignInError(null)
      setShowOtpInput(false)
      setOtpInput('')
    }
  }

  const handleEmailInputChange = (input: string) => {
    if (
      generalSubmitError === messages.disconnectDashboardWalletWrongUserError
    ) {
      setGeneralSubmitError(null)
    }
    if (otpEmail !== input) {
      toggleOtpUI(false)
    } else if (otpEmail === input && !showOtpInput) {
      toggleOtpUI(true)
    }
    setEmailInput(input)
  }

  const setAndLogGeneralSubmitError = (
    isUserError: boolean,
    errorMessage: string,
    error?: Error
  ) => {
    setGeneralSubmitError(errorMessage)
    record(
      make(Name.AUDIUS_OAUTH_ERROR, {
        isUserError,
        error: errorMessage,
        appId: (apiKey || appName)!,
        scope: scope!
      })
    )
    if (error && !isUserError) {
      reportToSentry({ level: ErrorLevel.Error, error })
    }
  }

  const setAndLogInvalidCredentialsError = () => {
    setSignInError(messages.invalidCredentialsError)
    record(
      make(Name.AUDIUS_OAUTH_ERROR, {
        isUserError: true,
        error: messages.invalidCredentialsError,
        appId: (apiKey || appName)!,
        scope: scope!
      })
    )
  }

  const handleAuthError = ({
    isUserError,
    errorMessage,
    error
  }: {
    isUserError: boolean
    errorMessage: string
    error?: Error
  }) => {
    setIsSubmitting(false)
    setMetaMaskTransactionStatus(null)
    setAndLogGeneralSubmitError(isUserError, errorMessage, error)
  }

  const handlePendingTransactionApproval = () => {
    setMetaMaskTransactionStatus('pending')
  }

  const handleReceiveTransactionApproval = () => {
    setMetaMaskTransactionStatus('approved')
  }

  const {
    scope,
    tx,
    queryParamsError,
    loading,
    userAlreadyWriteAuthorized,
    apiKey,
    appName,
    userEmail,
    authorize,
    txParams
  } = useOAuthSetup({
    onError: handleAuthError,
    onPendingTransactionApproval: handlePendingTransactionApproval,
    onReceiveTransactionApproval: handleReceiveTransactionApproval
  })

  const handleSignInFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    record(
      make(Name.AUDIUS_OAUTH_SUBMIT, {
        alreadySignedIn: false,
        appId: (apiKey || appName)!,
        scope: scope!
      })
    )
    clearErrors()
    if (!emailInput || !passwordInput || (showOtpInput && !otpInput)) {
      setAndLogGeneralSubmitError(true, messages.missingFieldError)
      return
    }
    setIsSubmitting(true)
    let signInResponse: any
    try {
      signInResponse = await audiusBackendInstance.signIn(
        emailInput,
        passwordInput,
        otpInput || undefined
      )
    } catch (err) {
      setIsSubmitting(false)
      setAndLogGeneralSubmitError(
        false,
        messages.miscError,
        err instanceof Error ? err : undefined
      )
      return
    }
    if (
      !signInResponse.error &&
      signInResponse.user &&
      signInResponse.user.name
    ) {
      // Success - perform Oauth authorization
      await authorize({
        account: signInResponse.user
      })
    } else if (
      (!signInResponse.error &&
        signInResponse.user &&
        !signInResponse.user.name) ||
      (signInResponse.error && signInResponse.phase === 'FIND_USER')
    ) {
      setIsSubmitting(false)
      setAndLogGeneralSubmitError(false, messages.accountIncompleteError)
    } else if (signInResponse.error && signInResponse.error.includes('403')) {
      setIsSubmitting(false)
      setOtpEmail(emailInput)
      toggleOtpUI(true)
    } else {
      setIsSubmitting(false)
      setAndLogInvalidCredentialsError()
    }
  }

  const handleAlreadySignedInAuthorizeSubmit = () => {
    clearErrors()
    record(
      make(Name.AUDIUS_OAUTH_SUBMIT, {
        alreadySignedIn: true,
        appId: (apiKey || appName)!,
        scope: scope!
      })
    )
    if (!account) {
      setAndLogGeneralSubmitError(false, messages.miscError)
    } else {
      setIsSubmitting(true)
      authorize({ account })
    }
  }

  const handleSignOut = () => {
    dispatch(signOut())
  }

  const isSubmitDisabled =
    generalSubmitError === messages.disconnectDashboardWalletWrongUserError

  let titleText
  if (!isLoggedIn) {
    titleText = messages.signInAndAuthorizePrompt(appName as string)
  } else if (userAlreadyWriteAuthorized) {
    titleText = messages.alreadyAuthorizedContinuePrompt(appName as string)
  } else {
    titleText = messages.alreadyLoggedInAuthorizePrompt(appName as string)
  }

  if (queryParamsError) {
    return (
      <ContentWrapper>
        <div className={cn(styles.centeredContent, styles.titleContainer)}>
          <span className={styles.errorText}>{queryParamsError}</span>
        </div>
      </ContentWrapper>
    )
  }
  if (loading) {
    return (
      <ContentWrapper>
        <div
          className={cn(styles.centeredContent, styles.loadingStateContainer)}
        >
          <LoadingSpinner className={styles.loadingStateSpinner} />
        </div>
      </ContentWrapper>
    )
  }

  if (metaMaskTransactionStatus != null) {
    return <ApproveTransactionScreen status={metaMaskTransactionStatus} />
  }

  return (
    <ContentWrapper>
      <div className={cn(styles.centeredContent, styles.titleContainer)}>
        <h1 className={styles.title}>{titleText}</h1>
      </div>
      {userAlreadyWriteAuthorized ? null : (
        <PermissionsSection
          scope={scope}
          tx={tx as WriteOnceTx}
          userEmail={userEmail}
          isLoggedIn={isLoggedIn}
          txParams={txParams}
        />
      )}
      <div className={styles.formArea}>
        {isLoggedIn ? (
          <div className={styles.userInfoContainer}>
            <h3 className={styles.infoSectionTitle}>{messages.signedInAs}</h3>
            <div className={styles.tile}>
              <ProfileInfo
                displayNameClassName={styles.userInfoDisplayName}
                handleClassName={styles.userInfoHandle}
                centered={false}
                imgClassName={styles.profileImg}
                className={styles.userInfo}
                user={account}
              />
            </div>
            <div className={styles.signOutButtonContainer}>
              <button className={styles.linkButton} onClick={handleSignOut}>
                {messages.signOut}
              </button>
            </div>
            <CTAButton
              isLoading={isSubmitting}
              disabled={isSubmitDisabled}
              onClick={handleAlreadySignedInAuthorizeSubmit}
            >
              {userAlreadyWriteAuthorized
                ? messages.continueButton
                : messages.authorizeButton}
            </CTAButton>
          </div>
        ) : (
          <div className={styles.signInFormContainer}>
            <form onSubmit={handleSignInFormSubmit}>
              <Input
                placeholder='Email'
                size='medium'
                type='email'
                name='email'
                id='email-input'
                required
                autoComplete='username'
                value={emailInput}
                onChange={handleEmailInputChange}
              />
              <Input
                className={styles.passwordInput}
                placeholder='Password'
                size='medium'
                name='password'
                id='password-input'
                required
                autoComplete='current-password'
                value={passwordInput}
                type='password'
                onChange={setPasswordInput}
              />
              {signInError == null ? null : (
                <div className={styles.credentialsErrorContainer}>
                  <IconValidationX
                    width={14}
                    height={14}
                    className={styles.credentialsErrorIcon}
                  />
                  <span className={styles.errorText}>{signInError}</span>
                </div>
              )}
              {showOtpInput ? (
                <Input
                  placeholder='Verification Code'
                  size='medium'
                  name='otp'
                  value={otpInput}
                  characterLimit={6}
                  type='number'
                  variant={'normal'}
                  onChange={setOtpInput}
                  className={cn(styles.otpInput)}
                />
              ) : null}
              <CTAButton type='submit' isLoading={isSubmitting}>
                {messages.signInButton}
              </CTAButton>
            </form>
            <div className={styles.signUpButtonContainer}>
              <a
                className={styles.linkButton}
                href={SIGN_UP_PAGE}
                target='_blank'
                rel='noopener noreferrer'
              >
                {messages.signUp}
              </a>
            </div>
          </div>
        )}
        {generalSubmitError == null ? null : (
          <div className={styles.generalErrorContainer}>
            <span className={styles.errorText}>{generalSubmitError}</span>
          </div>
        )}
      </div>
    </ContentWrapper>
  )
}
