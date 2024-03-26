import React, { useState } from 'react'

import { useAudiusQueryContext } from '@audius/common/audius-query'
import { socialMediaMessages } from '@audius/common/messages'
import { pickHandleSchema } from '@audius/common/schemas'
import { formatTwitterProfile } from '@audius/common/services'

import { SocialButton } from '@audius/harmony-native'
import { env } from 'app/env'
import { restrictedHandles } from 'app/screens/sign-on-screen/utils/restrictedHandles'
import { make, track } from 'app/services/analytics'
import * as oauthActions from 'app/store/oauth/actions'
import { Provider } from 'app/store/oauth/reducer'
import { EventNames } from 'app/types/analytics'

import OAuthWebView from '../../../components/oauth/OAuthWebView'
import type { SocialButtonProps } from '../../../components/social-button/SocialButton'

type SignUpFlowTwitterAuthProps = Partial<SocialButtonProps> & {
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter'
  }) => void
  onError: (e: unknown, additionalInfo?: Record<any, any>) => void
  onStart?: () => void
  onClose?: () => void
  page: 'create-email' | 'pick-handle'
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
  const response = await fetch(
    `${loginUrl}?oauth_verifier=${oAuthVerifier}&oauth_token=${oauthToken}`,
    {
      method: 'POST',
      credentials: credentialsType,
      headers
    }
  )
  return response.json()
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

    return {
      requiresReview,
      handle: profile.screen_name,
      isVerified: twitterProfile.verified
    }
  }
}

export const SignUpFlowTwitterAuth = ({
  onSuccess,
  onError,
  onStart,
  onClose,
  page
}: SignUpFlowTwitterAuthProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const setProfileFromTwitter = useSetProfileFromTwitter()
  const [authToken, setAuthToken] = useState<string | undefined>()
  const getOauthToken = async () => {
    // only refresh token if we don't have one already (avoid extra API calls)
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

  const authUrl = authenticationUrl(authToken)

  const handlePress = async () => {
    onStart?.()
    getOauthToken()
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_TWITTER,
        page
      })
    )
    setIsModalOpen(true)
  }

  const handleClose = () => {
    onClose?.()
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_CLOSED_TWITTER,
        page
      })
    )
    setIsModalOpen(false)
  }

  const handleResponse = async (payload: any) => {
    setIsModalOpen(false)
    if (!payload.error) {
      const { oauthVerifier, oauthToken } = payload
      if (oauthVerifier && oauthToken) {
        try {
          const { handle, requiresReview, isVerified } =
            await setProfileFromTwitter({
              oauthVerifier,
              oauthToken
            })
          track(
            make({
              eventName: EventNames.CREATE_ACCOUNT_COMPLETE_TWITTER,
              page,
              isVerified,
              handle: handle || 'unknown'
            })
          )
          onSuccess?.({ handle, requiresReview, platform: 'twitter' })
        } catch (e) {
          onError?.(e, { oauthVerifier, oauthToken, payload })
        }
      } else {
        onError?.(
          new Error(
            'No oauthToken/oauthVerifier received from Twitter payload'
          ),
          { oauthVerifier, oauthToken }
        )
      }
    } else {
      onError?.(new Error(payload.error))
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
