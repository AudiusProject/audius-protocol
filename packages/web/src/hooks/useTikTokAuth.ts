import { Name } from '@audius/common/models'
// Polyfills
import 'whatwg-fetch'
import 'url-search-params-polyfill'
import {} from '@audius/common'
import {
  createUseTikTokAuthHook,
  UseTikTokAuthArguments,
  Credentials
} from '@audius/common/hooks'

import { useRecord, make } from 'common/store/analytics/actions'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

/**
 * A hook that returns a withAuth function that can be passed a function which will
 * be provided with the TikTok credentials on existing or successful auth
 * @param {Object} args
 * @returns {Function}
 */
export const useTikTokAuth = (args: UseTikTokAuthArguments) => {
  const record = useRecord()

  const openPopup = () => {
    return window.open(
      '',
      '',
      'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=600, height=1000'
    )
  }

  const poll = (
    popup: Window,
    resolve: (credentials: Credentials) => void,
    reject: (error: Error) => void
  ) => {
    const interval = setInterval(async () => {
      if (!popup || popup.closed || popup.closed === undefined) {
        clearInterval(interval)
        reject(new Error('Popup has been closed by user'))
        return
      }

      const closeDialog = () => {
        clearInterval(interval)
        popup.close()
      }

      try {
        if (
          !popup.location.hostname.includes('tiktok.com') &&
          popup.location.hostname !== ''
        ) {
          if (popup.location.search) {
            const query = new URLSearchParams(popup.location.search)

            const authorizationCode = query.get('code')
            const csrfState = query.get('state')
            const error = query.get('error')
            if (authorizationCode && csrfState) {
              closeDialog()
              try {
                const credentials = await getAccessToken(
                  authorizationCode,
                  csrfState
                )
                resolve(credentials)
              } catch (e) {
                reject(e as Error)
              }
            } else {
              closeDialog()
              reject(
                new Error(
                  error ||
                    'OAuth redirect has occured but authorizationCode was not found.'
                )
              )
            }
          } else {
            closeDialog()
            reject(
              new Error(
                'OAuth redirect has occurred but no query or hash parameters were found.'
              )
            )
          }
        }
      } catch (error) {
        // Ignore DOMException: Blocked a frame with origin from accessing a cross-origin frame.
        // This will catch until the popup is redirected back to the same origin
      }
    }, 500)
  }

  const getAccessToken = async (
    authorizationCode: string,
    csrfState: string
  ) => {
    const response = await window.fetch(
      `${audiusBackendInstance.identityServiceUrl}/tiktok/access_token`,
      {
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({
          code: authorizationCode,
          state: csrfState
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(response.status + ' ' + (await response.text()))
    }

    const {
      data: { access_token, open_id, expires_in }
    } = await response.json()

    record(make(Name.TIKTOK_COMPLETE_OAUTH, {}))
    return {
      accessToken: access_token,
      openId: open_id,
      expiresIn: expires_in
    }
  }

  return createUseTikTokAuthHook({
    authenticate: () => {
      return new Promise<Credentials>((resolve, reject) => {
        record(make(Name.TIKTOK_START_OAUTH, {}))
        const authenticationUrl = `${audiusBackendInstance.identityServiceUrl}/tiktok`
        const popup = openPopup()

        if (popup) {
          popup.location.href = authenticationUrl
          poll(popup, resolve, reject)
        }
      })
    },
    handleError: (e: Error) => {
      record(make(Name.TIKTOK_OAUTH_ERROR, { error: e.message }))
    },
    getLocalStorageItem: async (key) => window.localStorage.getItem(key),
    setLocalStorageItem: async (key, value) =>
      window.localStorage.setItem(key, value)
  })(args)
}
