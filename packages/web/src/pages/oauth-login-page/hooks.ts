import { useMemo } from 'react'

import * as queryString from 'query-string'
import { useLocation } from 'react-router-dom'

import { messages } from './messages'
import { getIsRedirectValid, isValidApiKey } from './utils'

export const useParsedQueryParams = () => {
  const { search } = useLocation()

  const {
    scope,
    state,
    redirect_uri: redirectUri,
    app_name: appName,
    response_mode: responseMode,
    api_key: apiKey,
    origin
  } = queryString.parse(search)

  const parsedRedirectUri = useMemo<'postmessage' | URL | null>(() => {
    if (redirectUri && typeof redirectUri === 'string') {
      if (redirectUri.toLowerCase() === 'postmessage') {
        return 'postmessage'
      }
      try {
        const url = new URL(decodeURIComponent(redirectUri))
        // Ensure that the redirect_uri protocol is https
        // IMPORTANT: If this validation is not done, users can
        // use the redirect_uri to execute arbitrary code on the host
        // domain (e.g. audius.co).
        if (url.protocol !== 'https:') {
          throw new Error('Invalid redirect_uri protocol, https required')
        }
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

  let initError: string | null = null
  if (isRedirectValid === false) {
    initError = messages.redirectURIInvalidError
  } else if (parsedRedirectUri === 'postmessage' && !parsedOrigin) {
    // Only applicable if redirect URI set to `postMessage`
    initError = messages.originInvalidError
  } else if (scope !== 'read' && scope !== 'write') {
    initError = messages.scopeError
  } else if (
    responseMode &&
    responseMode !== 'query' &&
    responseMode !== 'fragment'
  ) {
    initError = messages.responseModeError
  } else if (scope === 'read') {
    // Read scope-specific validations:
    if (!appName && !apiKey) {
      initError = messages.missingAppNameError
    }
  } else if (scope === 'write') {
    // Write scope-specific validations:
    if (!apiKey) {
      initError = messages.missingApiKeyError
    } else if (!isValidApiKey(apiKey)) {
      initError = messages.invalidApiKeyError
    }
  }

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
    error: initError
  }
}
