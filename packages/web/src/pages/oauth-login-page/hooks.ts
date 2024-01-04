import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  accountSelectors,
  CommonState,
  encodeHashId,
  ErrorLevel,
  Name,
  statusIsNotFinalized,
  User
} from '@audius/common'
import * as queryString from 'query-string'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'

import { make, useRecord } from 'common/store/analytics/actions'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import * as errorActions from 'store/errors/actions'
import { reportToSentry } from 'store/errors/reportToSentry'

import { messages } from './messages'
import {
  authWrite,
  formOAuthResponse,
  getDeveloperApp,
  getIsAppAuthorized,
  getIsRedirectValid,
  isValidApiKey,
  validateWriteOnceParams,
  WriteOnceParams
} from './utils'
const { getAccountUser, getAccountStatus } = accountSelectors

export const useParsedQueryParams = () => {
  const { search } = useLocation()

  const {
    scope,
    state,
    redirect_uri: redirectUri,
    app_name: appName,
    response_mode: responseMode,
    api_key: apiKey,
    origin,
    tx,
    ...rest
  } = queryString.parse(search)

  const parsedRedirectUri = useMemo<'postmessage' | URL | null>(() => {
    if (redirectUri && typeof redirectUri === 'string') {
      if (redirectUri.toLowerCase() === 'postmessage') {
        return 'postmessage'
      }
      try {
        return new URL(decodeURIComponent(redirectUri))
      } catch {
        return null
      }
    }
    return null
  }, [redirectUri])

  const isRedirectValid = useMemo(() => {
    return getIsRedirectValid({ parsedRedirectUri, redirectUri })
  }, [parsedRedirectUri, redirectUri])

  const parsedOrigin = useMemo(() => {
    if (origin && typeof origin === 'string') {
      try {
        return new URL(origin)
      } catch {
        return null
      }
    }
    return null
  }, [origin])

  const { error, txParams } = useMemo(() => {
    let error: string | null = null
    let txParams: WriteOnceParams | null = null // Only used for scope=write_once
    if (isRedirectValid === false) {
      error = messages.redirectURIInvalidError
    } else if (parsedRedirectUri === 'postmessage' && !parsedOrigin) {
      // Only applicable if redirect URI set to `postMessage`
      error = messages.originInvalidError
    } else if (
      scope !== 'read' &&
      scope !== 'write' &&
      scope !== 'write_once'
    ) {
      error = messages.scopeError
    } else if (
      responseMode &&
      responseMode !== 'query' &&
      responseMode !== 'fragment'
    ) {
      error = messages.responseModeError
    } else if (scope === 'read') {
      // Read scope-specific validations:
      if (!appName && !apiKey) {
        error = messages.missingAppNameError
      }
    } else if (scope === 'write') {
      // Write scope-specific validations:
      if (!apiKey) {
        error = messages.missingApiKeyError
      } else if (!isValidApiKey(apiKey)) {
        error = messages.invalidApiKeyError
      }
    } else if (scope === 'write_once') {
      // Write-once scope-specific validations:
      const { error: writeOnceParamsError, txParams: txParamsRes } =
        validateWriteOnceParams({
          tx,
          params: rest
        })
      txParams = txParamsRes

      if (writeOnceParamsError) {
        error = writeOnceParamsError
      }
    }
    return { txParams, error }
    // This is exhaustive despite what eslint thinks:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRedirectValid, parsedOrigin, parsedRedirectUri, search])

  return {
    apiKey,
    appName,
    scope,
    redirectUri,
    state,
    responseMode,
    origin,
    parsedRedirectUri,
    isRedirectValid,
    parsedOrigin,
    error,
    tx,
    txParams
  }
}

export const useOAuthSetup = () => {
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
    txParams,
    tx,
    error: initError
  } = useParsedQueryParams()
  const accountIsLoading = useSelector((state: CommonState) => {
    const status = getAccountStatus(state)
    return statusIsNotFinalized(status)
  })
  const account = useSelector(getAccountUser)
  const isLoggedIn = Boolean(account)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [queryParamsError, setQueryParamsError] = useState<string | null>(
    initError
  )
  /** The fetched developer app name if write OAuth (we use `queryParamAppName` if read or writeOnce OAuth and no API key is given) */
  const [registeredDeveloperAppName, setRegisteredDeveloperAppName] =
    useState<string>()
  const appName = registeredDeveloperAppName ?? queryParamAppName

  const [userAlreadyWriteAuthorized, setUserAlreadyWriteAuthorized] =
    useState<boolean>()

  const loading =
    accountIsLoading ||
    (apiKey &&
      (registeredDeveloperAppName === undefined ||
        userAlreadyWriteAuthorized === undefined))

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

  const formResponseAndRedirect = useCallback(
    async ({
      account,
      grantCreated,
      onError,
      txSignature
    }: {
      account: User
      grantCreated?: boolean | undefined
      onError: ({
        isUserError,
        errorMessage,
        error
      }: {
        isUserError: boolean
        errorMessage: string
        error?: Error
      }) => void
      txSignature?: { message: string; signature: string }
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
        },
        txSignature
      })
      if (jwt == null) {
        onError({ isUserError: false, errorMessage: messages.miscError })
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
              onError({
                isUserError: false,
                errorMessage: messages.noWindowError
              })
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

  const authorize = async ({
    account,
    onError
  }: {
    account: User
    onError: ({
      isUserError,
      errorMessage,
      error
    }: {
      isUserError: boolean
      errorMessage: string
      error?: Error
    }) => void
  }) => {
    let shouldCreateWriteGrant = false
    let txSignature: { message: string; signature: string } | undefined

    if (scope === 'write') {
      try {
        shouldCreateWriteGrant = !(await getIsAppAuthorized({
          userId: encodeHashId(account.user_id),
          apiKey: apiKey as string
        }))
        if (shouldCreateWriteGrant) {
          await authWrite({
            userId: encodeHashId(account.user_id),
            appApiKey: apiKey as string
          })
        }
      } catch (e: unknown) {
        let error = 'Creating write grant failed'
        if (typeof e === 'string') {
          error = e.toUpperCase()
        } else if (e instanceof Error) {
          error = e.message
        }
        onError({
          isUserError: false,
          errorMessage: messages.miscError,
          error: e instanceof Error ? e : new Error(error)
        })
        return
      }
    } else if (scope === 'write_once') {
      // Note: Tx = 'connect_dashboard_wallet' since that's the only option available right now for write_once scope
      const message = `Connecting Audius protocol dashboard wallet ${
        txParams!.wallet
      } at ${Date.now()}`
      // Make signature and return
      const { signature } =
        await audiusBackendInstance.signDiscoveryNodeRequest(message)
      txSignature = { message, signature }
    }

    await formResponseAndRedirect({
      account,
      grantCreated: shouldCreateWriteGrant,
      onError,
      txSignature
    })
  }

  return {
    scope,
    queryParamsError,
    loading,
    userAlreadyWriteAuthorized,
    apiKey,
    appName,
    userEmail,
    authorize,
    tx,
    txParams: txParams as WriteOnceParams
  }
}
