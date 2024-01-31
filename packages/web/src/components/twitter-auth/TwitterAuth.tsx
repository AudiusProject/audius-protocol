import { CSSProperties, MouseEventHandler, ReactNode } from 'react'

import { TwitterProfile } from '@audius/common/store'
import 'whatwg-fetch'
import 'url-search-params-polyfill'

import { captureException } from '@sentry/browser'

import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

const REQUEST_TOKEN_URL = `${audiusBackendInstance.identityServiceUrl}/twitter`
const LOGIN_URL = `${audiusBackendInstance.identityServiceUrl}/twitter/callback`

export type TwitterAuthProps = {
  children?: ReactNode
  className?: string
  credentials?: 'omit' | 'same-origin' | 'include'
  customHeaders?: Record<string, any>
  dialogHeight?: number
  dialogWidth?: number
  forceLogin?: boolean
  onClick?: () => void
  onFailure: (error: any) => void
  onSuccess: (uuid: string, profile: TwitterProfile) => void
  screenName?: string
  style?: CSSProperties
  text?: string
}

const messages = {
  signIn: 'Sign in with Twitter'
}

const TwitterAuth = (props: TwitterAuthProps) => {
  const {
    children,
    className,
    credentials = 'same-origin',
    customHeaders,
    dialogHeight = 400,
    dialogWidth = 600,
    forceLogin = false,
    onClick,
    onFailure,
    onSuccess,
    screenName,
    style,
    text = messages.signIn
  } = props

  const onButtonClick: MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    onClick?.()
    return getRequestToken()
  }

  const getHeaders = () => {
    return { ...customHeaders, 'Content-Type': 'application/json' }
  }

  const getRequestToken = () => {
    const popup = openPopup()

    return window
      .fetch(REQUEST_TOKEN_URL, {
        method: 'POST',
        credentials,
        headers: getHeaders()
      })
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        let authenticationUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${data.oauth_token}&force_login=${forceLogin}`

        if (screenName) {
          authenticationUrl = `${authenticationUrl}&screen_name=${screenName}`
        }

        if (popup) {
          popup.location = authenticationUrl
          polling(popup)
        }
      })
      .catch((error) => {
        popup?.close()
        captureException(`Twitter getProfile failed with ${error}`)
        return onFailure(error)
      })
  }

  const openPopup = () => {
    const w = dialogWidth
    const h = dialogHeight

    return window.open(
      '',
      '',
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${w}, height=${h}`
    )
  }

  const polling = (popup: Window) => {
    const pollingInterval = setInterval(() => {
      if (!popup || popup.closed || popup.closed === undefined) {
        clearInterval(pollingInterval)
        onFailure(new Error('Popup has been closed by user'))
        return
      }

      const closeDialog = () => {
        clearInterval(pollingInterval)
        popup.close()
      }
      try {
        if (
          !popup.location.hostname.includes('api.twitter.com') &&
          popup.location.hostname !== ''
        ) {
          if (popup.location.search) {
            const query = new URLSearchParams(popup.location.search)

            const oauthToken = query.get('oauth_token')
            const oauthVerifier = query.get('oauth_verifier')
            if (oauthToken === null || oauthVerifier === null) return
            closeDialog()
            return getOauthToken(oauthVerifier, oauthToken)
          } else {
            closeDialog()
            return onFailure(
              new Error(
                'OAuth redirect has occurred but no query or hash parameters were found. ' +
                  'They were either not set during the redirect, or were removed—typically by a ' +
                  'routing library—before Twitter react component could read it.'
              )
            )
          }
        }
      } catch (error) {
        // Ignore DOMException: Blocked a frame with origin from accessing a cross-origin frame.
        // A hack to get around same-origin security policy errors in IE.
      }
    }, 500)
  }

  const getOauthToken = (oAuthVerifier: string, oauthToken: string) => {
    return window
      .fetch(
        `${LOGIN_URL}?oauth_verifier=${oAuthVerifier}&oauth_token=${oauthToken}`,
        {
          method: 'POST',
          credentials,
          headers: getHeaders()
        }
      )
      .then((response) => {
        if (!response.ok) {
          response.json().then((json) => onFailure(json.error))
        }
        response.json().then(({ uuid, profile }) => onSuccess(uuid, profile))
      })
      .catch((error) => {
        return onFailure(error)
      })
  }

  const getDefaultButtonContent = () => {
    return <span>{text}</span>
  }

  return (
    <span
      role='button'
      onClick={onButtonClick}
      style={style}
      className={className}
    >
      {children || getDefaultButtonContent()}
    </span>
  )
}

export default TwitterAuth
