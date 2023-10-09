import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState
} from 'react'

import {
  accountSelectors,
  CommonState,
  encodeHashId,
  ErrorLevel,
  Name,
  signOutActions,
  statusIsNotFinalized,
  User
} from '@audius/common'
import {
  Button,
  ButtonProps,
  IconArrow,
  IconAtSign,
  IconPencil,
  IconValidationX,
  IconVisibilityPublic
} from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import HorizontalLogo from 'assets/img/Horizontal-Logo-Full-Color.png'
import { make, useRecord } from 'common/store/analytics/actions'
import Input from 'components/data-entry/Input'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { ProfileInfo } from 'components/profile-info/ProfileInfo'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import * as errorActions from 'store/errors/actions'
import { reportToSentry } from 'store/errors/reportToSentry'
import { SIGN_UP_PAGE } from 'utils/route'

import styles from './OAuthLoginPage.module.css'
import { useParsedQueryParams } from './hooks'
import { messages } from './messages'
import {
  authWrite,
  formOAuthResponse,
  getDeveloperApp,
  getIsAppAuthorized
} from './utils'
const { signOut } = signOutActions
const { getAccountUser, getAccountStatus } = accountSelectors

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

const PermissionsSection = ({
  scope,
  isLoggedIn,
  userEmail
}: {
  scope: string | string[] | null
  isLoggedIn: boolean
  userEmail?: string | null
}) => {
  return (
    <>
      <div className={styles.permsTitleContainer}>
        <h3 className={styles.infoSectionTitle}>
          {messages.permissionsRequestedHeader}
        </h3>
      </div>
      <div className={styles.tile}>
        <div className={styles.permissionContainer}>
          <div
            className={cn({
              [styles.visibilityIconWrapper]: scope === 'read'
            })}
          >
            {scope === 'write' ? (
              <IconPencil
                className={cn(styles.permissionIcon)}
                width={18}
                height={18}
              />
            ) : (
              <IconVisibilityPublic
                className={cn(styles.permissionIcon, styles.visibilityIcon)}
                width={21}
                height={22}
              />
            )}
          </div>

          <div className={styles.permissionTextContainer}>
            <span className={styles.permissionText}>
              {scope === 'write'
                ? messages.writeAccountAccess
                : messages.readOnlyAccountAccess}
            </span>
            {scope === 'read' ? null : (
              <div className={cn(styles.permissionDetailTextContainer)}>
                <p
                  className={cn(
                    styles.permissionText,
                    styles.permissionDetailText
                  )}
                >
                  {messages.doesNotGrantAccessTo}
                  <br />
                  {messages.walletsOrDMs}
                </p>
              </div>
            )}
          </div>
        </div>
        <div
          className={cn(
            styles.permissionContainer,
            styles.nonFirstPermissionContainer
          )}
        >
          <div>
            <IconAtSign
              width={15}
              height={15}
              className={cn(styles.permissionIcon, styles.atSignIcon)}
            />
          </div>
          <div className={styles.permissionTextContainer}>
            <span className={styles.permissionText}>
              {messages.emailAddressAccess}
            </span>
            {isLoggedIn ? (
              <div className={cn(styles.permissionDetailTextContainer)}>
                <span
                  className={cn(
                    styles.permissionText,
                    styles.permissionDetailText,
                    {
                      [styles.permissionTextExtraLight]: !userEmail
                    }
                  )}
                >
                  {userEmail == null ? (
                    <>
                      <LoadingSpinner className={styles.loadingSpinner} />{' '}
                      {messages.emailLoading}&#8230;
                    </>
                  ) : (
                    userEmail
                  )}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}

const ContentWrapper = ({ children }: { children: ReactNode }) => (
  <div className={styles.wrapper}>
    <div className={styles.container}>
      <div className={styles.centeredContent}>
        <div className={styles.logoContainer}>
          <img src={HorizontalLogo} className={styles.logo} alt='Audius Logo' />
        </div>
      </div>
      {children}
    </div>
  </div>
)

export const OAuthLoginPage = () => {
  useLayoutEffect(() => {
    document.body.classList.add(styles.bgWhite)
    return () => {
      document.body.classList.remove(styles.bgWhite)
    }
  }, [])
  const record = useRecord()
  const history = useHistory()
  const dispatch = useDispatch()

  const {
    appName: queryParamAppName,
    apiKey,
    scope,
    redirectUri,
    state,
    responseMode,
    origin: originParam,
    parsedRedirectUri,
    isRedirectValid,
    parsedOrigin,
    error: initError
  } = useParsedQueryParams()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const accountIsLoading = useSelector((state: CommonState) => {
    const status = getAccountStatus(state)
    return statusIsNotFinalized(status)
  })
  const account = useSelector(getAccountUser)
  const isLoggedIn = Boolean(account)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  /** The fetched developer app name if write OAuth (we use `queryParamAppName` if read OAuth and no API key is given) */
  const [registeredDeveloperAppName, setRegisteredDeveloperAppName] =
    useState<string>()
  const appName = registeredDeveloperAppName ?? queryParamAppName

  const [userAlreadyWriteAuthorized, setUserAlreadyWriteAuthorized] =
    useState<boolean>()
  const [queryParamsError, setQueryParamsError] = useState<string | null>(
    initError
  )

  const loading =
    accountIsLoading ||
    (apiKey &&
      (registeredDeveloperAppName === undefined ||
        userAlreadyWriteAuthorized === undefined))

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

  const setAndLogGeneralSubmitError = useCallback(
    (isUserError: boolean, errorMessage: string, error?: Error) => {
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
    },
    [record, appName, apiKey, scope]
  )

  const setAndLogInvalidCredentialsError = () => {
    setHasCredentialsError(true)
    record(
      make(Name.AUDIUS_OAUTH_ERROR, {
        isUserError: true,
        error: messages.invalidCredentialsError,
        appId: (apiKey || appName)!,
        scope: scope!
      })
    )
  }

  useEffect(() => {
    if (!queryParamsError) {
      record(
        make(Name.AUDIUS_OAUTH_START, {
          redirectUriParam:
            parsedRedirectUri === 'postmessage' ? 'postmessage' : redirectUri!,
          originParam,
          responseMode,
          scope: scope!,
          apiKeyParam: apiKey,
          appId: (apiKey || appName)!
        })
      )
    }
  }, [
    appName,
    originParam,
    parsedRedirectUri,
    queryParamsError,
    record,
    redirectUri,
    responseMode,
    apiKey,
    scope
  ])

  useEffect(() => {
    const fetchDeveloperAppName = async () => {
      if (!apiKey || queryParamsError) {
        return
      }
      let developerApp
      try {
        developerApp = await getDeveloperApp(apiKey as string)
      } catch {
        setQueryParamsError(messages.invalidApiKeyError)
        return
      }
      if (!developerApp) {
        setQueryParamsError(messages.invalidApiKeyError)
        return
      }
      setRegisteredDeveloperAppName(developerApp.name)
    }
    fetchDeveloperAppName()
  }, [apiKey, queryParamAppName, queryParamsError, scope])

  const formResponseAndRedirect = useCallback(
    async ({
      account,
      grantCreated
    }: {
      account: User
      grantCreated?: boolean | undefined
    }) => {
      const jwt = await formOAuthResponse({
        account,
        userEmail,
        onError: () => {
          dispatch(
            errorActions.handleError({
              name: 'Form OAuth Response Error',
              message: 'Form OAuth Response Error',
              shouldRedirect: true
            })
          )
        }
      })
      if (jwt == null) {
        setIsSubmitting(false)
        setAndLogGeneralSubmitError(false, messages.miscError)
        return
      }
      if (isRedirectValid === true) {
        record(
          make(Name.AUDIUS_OAUTH_COMPLETE, {
            appId: (apiKey || appName)!,
            scope: scope!,
            alreadyAuthorized: grantCreated
          })
        )
        if (parsedRedirectUri === 'postmessage') {
          if (parsedOrigin) {
            if (!window.opener) {
              setAndLogGeneralSubmitError(false, messages.noWindowError)
              setIsSubmitting(false)
            } else {
              window.opener.postMessage(
                { state, token: jwt },
                parsedOrigin.origin
              )
            }
          }
        } else {
          if (responseMode && responseMode === 'query') {
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
    },
    [
      isRedirectValid,
      parsedOrigin,
      parsedRedirectUri,
      record,
      responseMode,
      setAndLogGeneralSubmitError,
      state,
      userEmail,
      apiKey,
      appName,
      scope,
      dispatch
    ]
  )

  useEffect(() => {
    const getInitialAuthorizationStatus = async () => {
      if (queryParamsError || !apiKey || !isLoggedIn) {
        setUserAlreadyWriteAuthorized(false)
        return
      }
      let appAlreadyAuthorized
      try {
        appAlreadyAuthorized = await getIsAppAuthorized({
          userId: encodeHashId(account!.user_id), // We know account exists because isLoggedIn is true
          apiKey: apiKey as string
        })
      } catch (e) {
        if (e instanceof Error) {
          reportToSentry({ level: ErrorLevel.Error, error: e })
        }
        dispatch(
          errorActions.handleError({
            name: 'Get Is App Authorized',
            message: 'Get Is App Authorized',
            shouldRedirect: true
          })
        )
        return
      }
      setUserAlreadyWriteAuthorized(appAlreadyAuthorized)
    }
    getInitialAuthorizationStatus()
  }, [
    account,
    apiKey,
    formResponseAndRedirect,
    history,
    isLoggedIn,
    queryParamsError,
    scope,
    dispatch
  ])

  useEffect(() => {
    const getAndSetEmail = async () => {
      let email: string
      try {
        email = await audiusBackendInstance.getUserEmail()
      } catch {
        setUserEmail(null)
        dispatch(
          errorActions.handleError({
            name: 'Get User Email',
            message: 'Get User Email',
            shouldRedirect: true
          })
        )
        return
      }
      setUserEmail(email)
    }
    if (isLoggedIn) {
      getAndSetEmail()
    } else {
      setUserEmail(null)
    }
  }, [history, isLoggedIn, dispatch])

  const authorize = async (account: User) => {
    let shouldCreateWriteGrant

    if (scope === 'write') {
      try {
        shouldCreateWriteGrant = await getIsAppAuthorized({
          userId: encodeHashId(account.user_id),
          apiKey: apiKey as string
        })
        if (!shouldCreateWriteGrant) {
          await authWrite({
            userId: encodeHashId(account.user_id),
            appApiKey: apiKey as string
          })
        }
      } catch (e: unknown) {
        setIsSubmitting(false)
        let errorMessage = 'Creating write grant failed'
        if (typeof e === 'string') {
          errorMessage = e.toUpperCase()
        } else if (e instanceof Error) {
          errorMessage = e.message
        }
        setAndLogGeneralSubmitError(
          false,
          errorMessage,
          e instanceof Error ? e : undefined
        )
        return
      }
    }
    await formResponseAndRedirect({
      account,
      grantCreated: shouldCreateWriteGrant
    })
  }

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
      await authorize(signInResponse.user)
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
      authorize(account)
    }
  }

  const handleSignOut = () => {
    dispatch(signOut())
  }

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

  return (
    <ContentWrapper>
      <div className={cn(styles.centeredContent, styles.titleContainer)}>
        <h1 className={styles.title}>{titleText}</h1>
      </div>
      {userAlreadyWriteAuthorized ? null : (
        <PermissionsSection
          scope={scope}
          userEmail={userEmail}
          isLoggedIn={isLoggedIn}
        />
      )}
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
            isSubmitting={isSubmitting}
            text={
              userAlreadyWriteAuthorized
                ? messages.continueButton
                : messages.authorizeButton
            }
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
    </ContentWrapper>
  )
}
