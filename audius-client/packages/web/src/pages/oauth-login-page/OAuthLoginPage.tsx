import { FormEvent, useEffect, useLayoutEffect, useMemo, useState } from 'react'

import { Name, User } from '@audius/common'
import {
  Button,
  ButtonProps,
  IconArrow,
  IconAtSign,
  IconValidationCheck,
  IconValidationX
} from '@audius/stems'
import base64url from 'base64url'
import cn from 'classnames'
import * as queryString from 'query-string'
import { useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'

import HorizontalLogo from 'assets/img/publicSite/Horizontal-Logo-Full-Color@2x.png'
import { getAccountUser } from 'common/store/account/selectors'
import { encodeHashId } from 'common/utils/hashIds'
import Input from 'components/data-entry/Input'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { ProfileInfo } from 'components/profile-info/ProfileInfo'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { localStorage } from 'services/local-storage'
import { make, useRecord } from 'store/analytics/actions'
import { ERROR_PAGE, SIGN_UP_PAGE } from 'utils/route'
import { signOut } from 'utils/signOut'

import styles from '../styles/OAuthLoginPage.module.css'

const messages = {
  alreadyLoggedInAuthorizePrompt: (appName: string) =>
    `Authorize ${appName} to use your Audius account?`,
  signInAndAuthorizePrompt: (appName: string) =>
    `Sign in to allow ${appName} to use your Audius account?`,
  permissionsRequestedHeader: 'This application will receive',
  readOnlyAccountAccess: 'Read-only access to your account',
  emailAddressAccess: 'Email address used to create your account',
  signOut: 'Not you? Sign Out & Switch Account',
  signUp: `Don't have an account? Sign up`,
  authorizeButton: 'Authorize App',
  signInButton: 'Sign In & Authorize App',
  invalidCredentialsError: 'Invalid Credentials',
  miscError: 'An error has occurred. Please try again.',
  accountIncompleteError:
    'It looks like your account was never fully completed! Please complete your sign-up first.',
  redirectURIInvalidError:
    'Whoops, this is an invalid link (redirect URI missing or invalid).',
  missingAppNameError: 'Whoops, this is an invalid link (app name missing).',
  scopeError: `Whoops, this is an invalid link (scope missing or invalid - only the 
    "read" scope is available).`,
  missingFieldError: 'Whoops, you must enter both your email and password.',
  originInvalidError:
    'Whoops, this is an invalid link (redirect URI is set to `postMessage` but origin is missing).',
  noWindowError:
    'Whoops, something went wrong. Please close this window and try again.',
  responseModeError:
    'Whoops, this is an invalid link (response mode invalid - if set, must be "fragment" or "query").'
}

const CTAButton = ({
  isSubmitting,
  ...restProps
}: { isSubmitting: boolean } & ButtonProps) => {
  return (
    <Button
      isDisabled={isSubmitting}
      rightIcon={
        isSubmitting ? (
          <LoadingSpinner className={styles.buttonLoadingSpinner} />
        ) : (
          <IconArrow />
        )
      }
      className={styles.ctaButton}
      {...restProps}
    />
  )
}

export const OAuthLoginPage = () => {
  useLayoutEffect(() => {
    document.body.classList.add(styles.bgWhite)
    return () => {
      document.body.classList.remove(styles.bgWhite)
    }
  }, [])
  const record = useRecord()

  const { search } = useLocation()
  const history = useHistory()
  const {
    scope,
    state,
    redirect_uri,
    app_name,
    response_mode,
    origin: originParam
  } = queryString.parse(search)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const parsedRedirectUri = useMemo(() => {
    if (redirect_uri && typeof redirect_uri === 'string') {
      if (redirect_uri.toLowerCase() === 'postmessage') {
        return 'postmessage'
      }
      try {
        return new URL(decodeURIComponent(redirect_uri))
      } catch {
        return null
      }
    }
    return null
  }, [redirect_uri])
  const account = useSelector(getAccountUser)
  const isLoggedIn = Boolean(account)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  useEffect(() => {
    const getAndSetEmail = async () => {
      let email: string
      try {
        email = await audiusBackendInstance.getUserEmail()
      } catch {
        setUserEmail(null)
        history.push(ERROR_PAGE)
        return
      }
      setUserEmail(email)
    }
    if (isLoggedIn) {
      getAndSetEmail()
    } else {
      setUserEmail(null)
    }
  }, [history, isLoggedIn])

  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [hasCredentialsError, setHasCredentialsError] = useState(false)
  const [generalSubmitError, setGeneralSubmitError] = useState<string | null>(
    null
  )

  const clearErrors = () => {
    setGeneralSubmitError(null)
    setHasCredentialsError(false)
  }

  const setAndLogGeneralSubmitError = (
    isUserError: boolean,
    errorMessage: string
  ) => {
    setGeneralSubmitError(errorMessage)
    record(make(Name.AUDIUS_OAUTH_ERROR, { isUserError, error: errorMessage }))
  }

  const setAndLogInvalidCredentialsError = () => {
    setHasCredentialsError(true)
    record(
      make(Name.AUDIUS_OAUTH_ERROR, {
        isUserError: true,
        error: messages.invalidCredentialsError
      })
    )
  }

  const isRedirectValid = useMemo(() => {
    if (redirect_uri) {
      if (parsedRedirectUri == null) {
        // This means the redirect uri is not a string (and is thus invalid) or the URI format was invalid
        return false
      }
      if (parsedRedirectUri === 'postmessage') {
        return true
      }
      const { hash, username, password, pathname, hostname } = parsedRedirectUri
      if (hash || username || password) {
        return false
      }
      if (
        pathname.includes('/..') ||
        pathname.includes('\\..') ||
        pathname.includes('../')
      ) {
        return false
      }

      // From https://stackoverflow.com/questions/106179/regular-expression-to-match-dns-hostname-or-ip-address:
      const ipRegex =
        /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/
      const localhostIPv4Regex =
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      // Disallow IP addresses as redirect URIs unless it's localhost
      if (
        ipRegex.test(hostname) &&
        hostname !== '[::1]' &&
        !localhostIPv4Regex.test(hostname)
      ) {
        return false
      }
      // TODO(nkang): Potentially check URI against malware list like https://urlhaus-api.abuse.ch/#urlinfo
      return true
    } else {
      return false
    }
  }, [parsedRedirectUri, redirect_uri])

  const parsedOrigin = useMemo(() => {
    if (originParam && typeof originParam === 'string') {
      try {
        return new URL(originParam)
      } catch {
        return null
      }
    }
    return null
  }, [originParam])

  let queryParamsError: string | null = null
  if (isRedirectValid === false) {
    queryParamsError = messages.redirectURIInvalidError
  } else if (parsedRedirectUri === 'postmessage' && !parsedOrigin) {
    // Only applicable if redirect URI set to `postMessage`
    queryParamsError = messages.originInvalidError
  } else if (!app_name) {
    queryParamsError = messages.missingAppNameError
  } else if (scope !== 'read') {
    queryParamsError = messages.scopeError
  } else if (
    response_mode &&
    response_mode !== 'query' &&
    response_mode !== 'fragment'
  ) {
    queryParamsError = messages.responseModeError
  }

  useEffect(() => {
    if (!queryParamsError) {
      record(
        make(Name.AUDIUS_OAUTH_START, {
          redirectUriParam:
            parsedRedirectUri === 'postmessage' ? 'postmessage' : redirect_uri!,
          originParam,
          appNameParam: app_name!,
          responseMode: response_mode
        })
      )
    }
  }, [
    app_name,
    originParam,
    parsedRedirectUri,
    queryParamsError,
    record,
    redirect_uri,
    response_mode
  ])

  const formOAuthResponse = async (account: User) => {
    let email: string
    if (!userEmail) {
      try {
        email = await audiusBackendInstance.getUserEmail()
      } catch {
        history.push(ERROR_PAGE)
        return
      }
    } else {
      email = userEmail
    }

    const gateways = audiusBackendInstance.getCreatorNodeIPFSGateways(
      account.creator_node_endpoint
    )
    const cNode = gateways[0]
    let profilePicture:
      | { '150x150': string; '480x480': string; '1000x1000': string }
      | undefined
    if (account.profile_picture_sizes) {
      const base = `${cNode}${account.profile_picture_sizes}/`
      profilePicture = {
        '150x150': `${base}150x150.jpg`,
        '480x480': `${base}480x480.jpg`,
        '1000x1000': `${base}1000x1000.jpg`
      }
    } else if (account.profile_picture) {
      const url = `${cNode}${account.profile_picture}`
      profilePicture = {
        '150x150': url,
        '480x480': url,
        '1000x1000': url
      }
    }
    const timestamp = Math.round(new Date().getTime() / 1000)
    const userId = encodeHashId(account?.user_id)
    const response = {
      userId,
      email,
      name: account?.name,
      handle: account?.handle,
      verified: account?.is_verified,
      profilePicture,
      sub: userId,
      iat: timestamp
    }
    const header = base64url.encode(
      JSON.stringify({ typ: 'JWT', alg: 'keccak256' })
    )
    const payload = base64url.encode(JSON.stringify(response))

    const message = `${header}.${payload}`
    let signedData: { data: string; signature: string }
    try {
      signedData = await audiusBackendInstance.signDiscoveryNodeRequest(message)
    } catch {
      return
    }
    const signature = signedData.signature
    return `${header}.${payload}.${base64url.encode(signature)}`
  }

  const authAndRedirect = async (account: User) => {
    const jwt = await formOAuthResponse(account)
    if (jwt == null) {
      setIsSubmitting(false)
      setAndLogGeneralSubmitError(false, messages.miscError)
      return
    }
    if (isRedirectValid === true) {
      if (parsedRedirectUri === 'postmessage') {
        if (parsedOrigin) {
          if (!window.opener) {
            setAndLogGeneralSubmitError(false, messages.noWindowError)
            setIsSubmitting(false)
          } else {
            record(make(Name.AUDIUS_OAUTH_COMPLETE, {}))
            window.opener.postMessage(
              { state, token: jwt },
              parsedOrigin.origin
            )
          }
        }
      } else {
        record(make(Name.AUDIUS_OAUTH_COMPLETE, {}))
        if (response_mode && response_mode === 'query') {
          if (state != null) {
            parsedRedirectUri!.searchParams.append('state', state as string)
          }
          parsedRedirectUri!.searchParams.append('token', jwt)
        } else {
          const statePart = state != null ? `state=${state}&` : ''
          parsedRedirectUri!.hash = `#${statePart}token=${jwt}`
        }
        window.location.href = parsedRedirectUri!.toString()
      }
    }
  }

  const handleSignInFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    record(make(Name.AUDIUS_OAUTH_SUBMIT, { alreadySignedIn: false }))
    clearErrors()
    if (!emailInput || !passwordInput) {
      setAndLogGeneralSubmitError(true, messages.missingFieldError)
      return
    }
    setIsSubmitting(true)
    let signInResponse: any
    try {
      signInResponse = await audiusBackendInstance.signIn(
        emailInput,
        passwordInput
      )
    } catch (err) {
      setIsSubmitting(false)
      setAndLogGeneralSubmitError(false, messages.miscError)
      return
    }
    if (
      !signInResponse.error &&
      signInResponse.user &&
      signInResponse.user.name
    ) {
      // Success - perform Oauth authorization
      await authAndRedirect(signInResponse.user)
    } else if (
      (!signInResponse.error &&
        signInResponse.user &&
        !signInResponse.user.name) ||
      (signInResponse.error && signInResponse.phase === 'FIND_USER')
    ) {
      setIsSubmitting(false)
      setAndLogGeneralSubmitError(false, messages.accountIncompleteError)
    } else {
      setIsSubmitting(false)
      setAndLogInvalidCredentialsError()
    }
  }

  const handleAlreadySignedInAuthorizeSubmit = () => {
    clearErrors()
    record(make(Name.AUDIUS_OAUTH_SUBMIT, { alreadySignedIn: true }))
    if (!account) {
      setAndLogGeneralSubmitError(false, messages.miscError)
    } else {
      setIsSubmitting(true)
      authAndRedirect(account)
    }
  }

  if (queryParamsError) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.centeredContent}>
            <img
              src={HorizontalLogo}
              className={styles.logo}
              alt='Audius Logo'
            />
          </div>
          <div className={cn(styles.centeredContent, styles.titleContainer)}>
            <span className={styles.errorText}>{queryParamsError}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.centeredContent}>
          <div className={styles.logoContainer}>
            <img
              src={HorizontalLogo}
              className={styles.logo}
              alt='Audius Logo'
            />
          </div>
        </div>
        <div className={cn(styles.centeredContent, styles.titleContainer)}>
          <h1 className={styles.title}>
            {isLoggedIn
              ? messages.alreadyLoggedInAuthorizePrompt(app_name as string)
              : messages.signInAndAuthorizePrompt(app_name as string)}
          </h1>
        </div>
        <div className={styles.permsTitleContainer}>
          <h3 className={styles.infoSectionTitle}>
            {messages.permissionsRequestedHeader}
          </h3>
        </div>
        <div className={styles.tile}>
          <div className={styles.permissionContainer}>
            <div>
              <IconValidationCheck width={16} height={16} />
            </div>

            <div className={styles.permissionTextContainer}>
              <span className={styles.permissionText}>
                {messages.readOnlyAccountAccess}
              </span>
            </div>
          </div>
          <div
            className={cn(
              styles.permissionContainer,
              styles.nonFirstPermissionContainer
            )}
          >
            <div>
              <IconValidationCheck width={16} height={16} />
            </div>
            <div className={styles.permissionTextContainer}>
              <span className={styles.permissionText}>
                {messages.emailAddressAccess}
              </span>
            </div>
          </div>
          {isLoggedIn ? (
            <div
              className={cn(
                styles.permissionContainer,
                styles.nonFirstPermissionContainer
              )}
            >
              <div>
                <IconAtSign
                  width={16}
                  height={16}
                  className={styles.atSignIcon}
                />
              </div>
              <div className={styles.permissionTextContainer}>
                <span
                  className={cn(styles.permissionText, {
                    [styles.permissionTextLight]: Boolean(userEmail),
                    [styles.permissionTextExtraLight]: !userEmail
                  })}
                >
                  {userEmail == null ? (
                    <>
                      <LoadingSpinner className={styles.loadingSpinner} /> Email
                      loading...
                    </>
                  ) : (
                    userEmail
                  )}
                </span>
              </div>
            </div>
          ) : null}
        </div>
        {isLoggedIn ? (
          <div className={styles.userInfoContainer}>
            <h3 className={styles.infoSectionTitle}>
              You&apos;re signed in as
            </h3>
            <div className={styles.tile}>
              <ProfileInfo
                displayNameClassName={styles.userInfoDisplayName}
                handleClassName={styles.userInfoDisplayName}
                centered={false}
                imgClassName={styles.profileImg}
                className={styles.userInfo}
                user={account}
              />
            </div>
            <div className={styles.signOutButtonContainer}>
              <button
                className={styles.linkButton}
                onClick={() => signOut(audiusBackendInstance, localStorage)}
              >
                {messages.signOut}
              </button>
            </div>
            <CTAButton
              isSubmitting={isSubmitting}
              text={messages.authorizeButton}
              onClick={handleAlreadySignedInAuthorizeSubmit}
            />
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
                onChange={setEmailInput}
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
              {!hasCredentialsError ? null : (
                <div className={styles.credentialsErrorContainer}>
                  <IconValidationX
                    width={14}
                    height={14}
                    className={styles.credentialsErrorIcon}
                  />
                  <span className={styles.errorText}>
                    {messages.invalidCredentialsError}
                  </span>
                </div>
              )}
              <CTAButton
                isSubmitting={isSubmitting}
                text={messages.signInButton}
                buttonType='submit'
              />
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
    </div>
  )
}
