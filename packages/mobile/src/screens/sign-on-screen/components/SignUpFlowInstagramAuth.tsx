import React, { useState } from 'react'

import {
  Name,
  pickHandleSchema,
  socialMediaMessages,
  useAudiusQueryContext
} from '@audius/common'
import * as signOnActions from 'common/store/pages/signon/actions'
import Config from 'react-native-config'
import { useDispatch } from 'react-redux'

import { SocialButton } from 'app/screens/sign-on-screen/components/temp-harmony/SocialButton'
import { restrictedHandles } from 'app/screens/sign-on-screen/utils/restrictedHandles'
import { make, track } from 'app/services/analytics'
import { env } from 'app/services/env'
import { Provider } from 'app/store/oauth/reducer'
import { getInstagramProfile } from 'app/store/oauth/sagas'
import type { InstagramCredentials } from 'app/store/oauth/types'
import { EventNames } from 'app/types/analytics'

import OAuthWebView from '../../../components/oauth/OAuthWebView'
import type { SocialButtonProps } from '../../../components/social-button/SocialButton'

type SignUpFlowInstagramAuthProps = Partial<SocialButtonProps> & {
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'instagram'
  }) => void
  onError: (e: unknown) => void
  onStart?: () => void
  onClose?: () => void
}

const instagramAppId = Config.INSTAGRAM_APP_ID!
const instagramRedirectUrl = Config.INSTAGRAM_REDIRECT_URL!

const signUpFlowInstagramAuthorizeUrl = `https://api.instagram.com/oauth/authorize?client_id=${instagramAppId}&redirect_uri=${encodeURIComponent(
  instagramRedirectUrl
)}&scope=user_profile,user_media&response_type=code`

const useSetProfileFromInstagram = () => {
  const dispatch = useDispatch()
  const audiusQueryContext = useAudiusQueryContext()

  return async ({ code }: { code: string }) => {
    const { igUserProfile: profile } = await getInstagramProfile(
      code,
      env.IDENTITY_SERVICE!
    )
    // Update info in redux
    dispatch(
      signOnActions.setInstagramProfile(
        profile.id,
        profile,
        profile.profile_pic_url_hd
          ? {
              uri: profile.profile_pic_url_hd,
              name: 'ProfileImage',
              type: 'image/jpeg'
            }
          : null
      )
    )

    // Check if handle is valid using same schema as handle page
    const handleSchema = pickHandleSchema({
      audiusQueryContext: audiusQueryContext!,
      skipReservedHandleCheck: profile.is_verified,
      restrictedHandles
    })
    const validationResult = await handleSchema.safeParseAsync({
      handle: profile.username
    })
    const requiresReview = !validationResult.success

    return {
      requiresReview,
      handle: profile.username,
      isVerified: profile.is_verified
    }
  }
}

export const SignUpFlowInstagramAuth = ({
  onSuccess,
  onError,
  onStart,
  onClose
}: SignUpFlowInstagramAuthProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const setProfileFromInstagram = useSetProfileFromInstagram()

  const handlePress = async () => {
    onStart?.()
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_INSTAGRAM
      })
    )
    setIsModalOpen(true)
  }

  const handleClose = () => {
    onClose?.()
    setIsModalOpen(false)
  }

  const handleResponse = async (
    payload: InstagramCredentials | { error: string }
  ) => {
    setIsModalOpen(false)
    if (!('error' in payload)) {
      const { code } = payload
      if (code) {
        try {
          const { requiresReview, isVerified, handle } =
            await setProfileFromInstagram({
              code
            })
          // keep analytics up to date
          track(
            make({
              eventName: Name.CREATE_ACCOUNT_COMPLETE_INSTAGRAM,
              isVerified,
              handle: handle || 'unknown'
            })
          )
          onSuccess({ handle, requiresReview, platform: 'instagram' })
        } catch (e) {
          onError(e)
        }
      } else {
        onError(new Error('Unable to retrieve information'))
      }
    } else {
      onError(new Error(payload.error).message)
    }
  }

  return (
    <>
      <OAuthWebView
        isOpen={isModalOpen}
        url={signUpFlowInstagramAuthorizeUrl}
        provider={Provider.INSTAGRAM}
        onClose={handleClose}
        onResponse={handleResponse}
      />
      <SocialButton
        socialType='instagram'
        style={{ flex: 1, height: '100%' }}
        onPress={handlePress}
        title={socialMediaMessages.signUpInstagram}
        noText
      />
    </>
  )
}
