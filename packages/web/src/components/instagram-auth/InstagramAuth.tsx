import { ReactNode, useCallback, MouseEvent } from 'react'

import * as Sentry from '@sentry/browser'
import cn from 'classnames'
import 'url-search-params-polyfill'

import { StringKeys } from 'common/services/remote-config'
import { InstagramProfile } from 'common/store/account/reducer'
import { RequestInstagramAuthMessage } from 'services/native-mobile-interface/oauth'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const HOSTNAME = process.env.REACT_APP_PUBLIC_HOSTNAME
const INSTAGRAM_APP_ID = process.env.REACT_APP_INSTAGRAM_APP_ID
const INSTAGRAM_REDIRECT_URL =
  process.env.REACT_APP_INSTAGRAM_REDIRECT_URL || ''
const INSTAGRAM_AUTHORIZE_URL = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
  INSTAGRAM_REDIRECT_URL
)}&scope=user_profile,user_media&response_type=code`

// Route to fetch instagram user data w/ the username
export const getIGUserUrl = (endpoint: string, username: string) => {
  const url = endpoint.replace('$USERNAME$', username)
  return url
}

// Instagram User profile fields to capture
const igUserFields = [
  'id',
  'username',
  'biography',
  'full_name',
  'is_verified',
  'is_private',
  'external_url',
  'business_email',
  'is_business_account',
  'profile_pic_url',
  'profile_pic_url_hd',
  'edge_followed_by',
  'edge_follow'
]

type InstagramAuthProps = {
  dialogWidth?: number
  dialogHeight?: number
  setProfileUrl: string
  getUserUrl: string
  onClick: () => void
  onSuccess: (uuid: string, profile: any) => void
  onFailure: (error: any) => void
  style?: object
  disabled?: boolean
  className?: string
  children?: ReactNode
  text?: string
  /**
   * Whether or not the success of this instagram auth
   * depends on fetching metadata or not.
   * Generally speaking, fetching metadata is not reliable,
   * so if the purpose of this auth is just verification
   * that the user has OAuthed, not to pull specific data,
   * set this flag to false.
   * Without metadata, instagram gives you very few fields:
   * https://developers.facebook.com/docs/instagram-basic-display-api/reference/user
   */
  requiresProfileMetadata?: boolean
}

const InstagramAuth = ({
  dialogWidth = 400,
  dialogHeight = 740,
  setProfileUrl,
  getUserUrl,
  onClick = () => {},
  onSuccess = (uuid: string, profile: any) => {},
  onFailure = () => {},
  style = {},
  disabled = false,
  className,
  children,
  text = 'Sign in with Instagram',
  requiresProfileMetadata = true
}: InstagramAuthProps) => {
  // Opens a popup window for the instagram authentication
  const openPopup = useCallback(() => {
    return window.open(
      '',
      '',
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${dialogWidth}, height=${dialogHeight}`
    )
  }, [dialogWidth, dialogHeight])

  const getProfile = useCallback(
    async (code) => {
      try {
        // Fetch the profile from the graph API
        const profileResp = await window.fetch(getUserUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        })
        const profileRespJson = await profileResp.json()
        if (!profileRespJson.username) {
          return onFailure(new Error('Unable to fetch information'))
        }

        // Fetch the profile metadata
        let igUserProfile: InstagramProfile

        const profileEndpoint =
          remoteConfigInstance.getRemoteVar(
            StringKeys.INSTAGRAM_API_PROFILE_URL
          ) || 'https://instagram.com/$USERNAME$/?__a=1'
        const fetchIGUserUrl = getIGUserUrl(
          profileEndpoint,
          profileRespJson.username
        )
        try {
          const igProfile = await window.fetch(fetchIGUserUrl)
          const igProfileJson = await igProfile.json()
          if (!igProfileJson.graphql || !igProfileJson.graphql.user) {
            throw new Error('Unable to fetch information')
          }
          igUserProfile = igUserFields.reduce((profile, field) => {
            ;(profile as any)[field] = igProfileJson.graphql.user[field]
            return profile
          }, {} as InstagramProfile)
        } catch (e) {
          if (requiresProfileMetadata) {
            return onFailure(e)
          }

          // Pull metadata from what we have and keep going
          igUserProfile = igUserFields.reduce((profile, field) => {
            ;(profile as any)[field] = profileRespJson[field]
            return profile
          }, {} as InstagramProfile)
        }

        const setProfileResponse = await window.fetch(setProfileUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: igUserProfile })
        })

        if (!setProfileResponse.ok) {
          return onFailure(new Error('Unable to fetch information'))
        }

        return onSuccess(igUserProfile.username, igUserProfile)
      } catch (err) {
        console.log(err)
        onFailure((err as Error).message)
        Sentry.captureException(`Instagram getProfile failed with ${err}`)
      }
    },
    [getUserUrl, setProfileUrl, onSuccess, onFailure, requiresProfileMetadata]
  )

  const polling = useCallback(
    (popup: any) => {
      const pollingInterval = setInterval(() => {
        if (!popup || popup.closed || popup.closed === undefined) {
          clearInterval(pollingInterval)
          onFailure(new Error('Popup has been closed by user'))
          return
        }

        const closeDialog = () => {
          clearInterval(pollingInterval)
          console.log(popup)
          popup.close()
        }
        try {
          if (
            popup.location.hostname.includes('audius.co') ||
            popup.location.hostname.includes(HOSTNAME) ||
            popup.location.hostname.includes(window.location.hostname)
          ) {
            if (popup.location.search) {
              const query = new URLSearchParams(popup.location.search)

              const instagramCode = query.get('code')
              if (instagramCode === null) return
              closeDialog()
              return getProfile(instagramCode)
            } else {
              closeDialog()
              return onFailure(
                new Error(
                  'OAuth redirect has occurred but no query or hash parameters were found. ' +
                    'They were either not set during the redirect, or were removed—typically by a ' +
                    'routing library—before Instagram react component could read it.'
                )
              )
            }
          }
        } catch (error) {
          // Ignore DOMException: Blocked a frame with origin from accessing a cross-origin frame.
          // A hack to get around same-origin security policy errors in IE.
        }
      }, 500)
    },
    [getProfile, onFailure]
  )

  const getRequestToken = useCallback(async () => {
    const popup = openPopup()
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (!popup) {
      console.error('unable to open window')
    }
    try {
      if (popup) {
        // @ts-ignore
        popup.location = INSTAGRAM_AUTHORIZE_URL
        // @ts-ignore
        polling(popup)
      }
    } catch (error) {
      console.log(error)
      if (popup) popup.close()
      return onFailure(error)
    }
  }, [openPopup, polling, onFailure])

  const onNativeVerification = useCallback(async () => {
    try {
      if (onClick) onClick()
      const message = new RequestInstagramAuthMessage(INSTAGRAM_AUTHORIZE_URL)
      message.send()
      const response = await message.receive()
      if (response.code) {
        return await getProfile(response.code)
      } else {
        onFailure(new Error('Unable to retrieve information'))
      }
    } catch (error) {
      onFailure(error)
    }
  }, [onClick, onFailure, getProfile])

  const onButtonClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      if (onClick) onClick()
      return getRequestToken()
    },
    [onClick, getRequestToken]
  )

  const getDefaultButtonContent = useCallback(() => <span>{text}</span>, [text])

  return (
    <div
      onClick={NATIVE_MOBILE ? onNativeVerification : onButtonClick}
      style={style}
      className={cn({
        [className!]: !!className,
        disabled: !!disabled
      })}>
      {children || getDefaultButtonContent()}
    </div>
  )
}

export default InstagramAuth
