import React, { useState } from 'react'

import {
  formatTwitterProfile,
  pickHandleSchema,
  socialMediaMessages,
  useAudiusQueryContext
} from '@audius/common'
import { useAsync } from 'react-use'

import { SocialButton } from '@audius/harmony-native'
import { env } from 'app/env'
import { restrictedHandles } from 'app/screens/sign-on-screen/utils/restrictedHandles'
import * as oauthActions from 'app/store/oauth/actions'
import { Provider } from 'app/store/oauth/reducer'

import OAuthWebView from '../../../components/oauth/OAuthWebView'
import type { SocialButtonProps } from '../../../components/social-button/SocialButton'

type SignUpFlowTwitterAuthProps = Partial<SocialButtonProps> & {
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter'
  }) => void
  onError: (e: unknown) => void
  onStart?: () => void
  onClose?: () => void
}

const twitterApi = {
  loginUrl: `${env.IDENTITY_SERVICE}/twitter/callback`,
  requestTokenUrl: `${env.IDENTITY_SERVICE}/twitter`,
  forceLogin: true,
  screenName: '',
  credentialsType: 'same-origin' as CredentialsType,
  headers: {
    'Content-Type': 'application/json',
    origin: env.AUDIUS_URL,
    referrer: env.AUDIUS_URL
  }
}

const getOauthToken = async (
  loginUrl: string,
  oAuthVerifier: string,
  oauthToken: string,
  headers: any,
  credentialsType: CredentialsType
) => {
  try {
    const response = await fetch(
      `${loginUrl}?oauth_verifier=${oAuthVerifier}&oauth_token=${oauthToken}`,
      {
        method: 'POST',
        credentials: credentialsType,
        headers
      }
    )
    return response.json()
  } catch (error) {
    console.error(error)
    throw new Error(error.message)
  }
}

const authenticationUrl = (oauthToken: string | undefined) =>
  `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}&force_login=${twitterApi.forceLogin}`

type CredentialsType = 'omit' | 'same-origin' | 'include'

const useSetProfileFromTwitter = () => {
  const audiusQueryContext = useAudiusQueryContext()

  return async ({
    oauthVerifier,
    oauthToken
  }: {
    oauthVerifier: string
    oauthToken: string
  }) => {
    // Get profile details from twitter
    const tokenRes = await getOauthToken(
      twitterApi.loginUrl,
      oauthVerifier,
      oauthToken,
      twitterApi.headers,
      twitterApi.credentialsType
    )
    const { uuid, profile: twitterProfile } = tokenRes

    // format results
    const { profile, profileImage, profileBanner } = await formatTwitterProfile(
      twitterProfile,
      async (image) => image
    )

    // Verify handle matches our schema
    const handleSchema = pickHandleSchema({
      audiusQueryContext: audiusQueryContext!,
      skipReservedHandleCheck: profile.verified,
      restrictedHandles
    })
    const validationResult = await handleSchema.safeParseAsync({
      handle: profile.screen_name
    })
    const requiresReview = !validationResult.success

    // Update redux store
    oauthActions.setTwitterInfo(
      uuid,
      profile,
      profileImage,
      profileBanner,
      requiresReview
    )

    return { requiresReview, handle: profile.screen_name }
  }
}

const useTwitterAuthToken = () => {
  const [authToken, setAuthToken] = useState<string | undefined>()
  useAsync(async () => {
    // only refresh token if we don't have one already (avoid extra API calls)
    if (!authToken) {
      const tokenResp = await fetch(twitterApi.requestTokenUrl, {
        method: 'POST',
        credentials: twitterApi.credentialsType,
        headers: twitterApi.headers
      })
      const tokenRespJson = await tokenResp.json()
      if (tokenRespJson.oauth_token) {
        setAuthToken(tokenRespJson.oauth_token)
      }
    }
  }, [])

  return authToken
}

export const SignUpFlowTwitterAuth = ({
  onSuccess,
  onError,
  onStart,
  onClose
}: SignUpFlowTwitterAuthProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const setProfileFromTwitter = useSetProfileFromTwitter()
  const authToken = useTwitterAuthToken()
  const authUrl = authenticationUrl(authToken)

  const handlePress = async () => {
    onStart?.()
    setIsModalOpen(true)
  }

  const handleClose = () => {
    onClose?.()
    setIsModalOpen(false)
  }

  const handleResponse = async (payload: any) => {
    setIsModalOpen(false)
    if (!payload.error) {
      const { oauthVerifier, oauthToken } = payload
      if (oauthVerifier && oauthToken) {
        try {
          const { handle, requiresReview } = await setProfileFromTwitter({
            oauthVerifier,
            oauthToken
          })
          onSuccess?.({ handle, requiresReview, platform: 'twitter' })
        } catch (e) {
          onError(e)
        }
      } else {
        onError(new Error('Failed oauth'))
      }
    } else {
      onError(new Error(payload.error).message)
    }
  }

  return (
    <>
      <OAuthWebView
        isOpen={isModalOpen}
        url={authUrl}
        provider={Provider.TWITTER}
        onClose={handleClose}
        onResponse={handleResponse}
      />
      <SocialButton
        socialType='twitter'
        onPress={handlePress}
        aria-label={socialMediaMessages.signUpTwitter}
      />
    </>
  )
}
