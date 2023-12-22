import React, { useState } from 'react'

import {
  formatTwitterProfile,
  pickHandleSchema,
  socialMediaMessages,
  useAudiusQueryContext
} from '@audius/common'
import Config from 'react-native-config'
import { useAsync } from 'react-use'

import { SocialButton } from 'app/screens/sign-on-screen/components/temp-harmony/SocialButton'
import { restrictedHandles } from 'app/screens/sign-on-screen/utils/restrictedHandles'
import { env } from 'app/services/env'
import * as oauthActions from 'app/store/oauth/actions'
import { Provider } from 'app/store/oauth/reducer'

import OAuthWebview from '../../../components/oauth/OAuth'
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
    origin: Config.AUDIUS_URL,
    referrer: Config.AUDIUS_URL
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

const authenticationUrl = (oauthToken: string) =>
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
  const [authToken, setAuthToken] = useState()

  useAsync(async () => {
    if (!authToken) {
      const tokenResp = await fetch(twitterApi.requestTokenUrl, {
        method: 'POST',
        credentials: twitterApi.credentialsType,
        headers: twitterApi.headers
      })
      const tokenRespJson = await tokenResp.json()
      setAuthToken(tokenRespJson.oauth_token)
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
      {authToken && (
        <OAuthWebview
          isOpen={isModalOpen}
          url={authenticationUrl(authToken)}
          provider={Provider.TWITTER}
          onClose={handleClose}
          onResponse={handleResponse}
        />
      )}
      <SocialButton
        socialType='twitter'
        style={{ flex: 1, height: '100%' }}
        onPress={handlePress}
        title={socialMediaMessages.signUpTwitter}
        noText
      />
    </>
  )
}
