import React, { useState } from 'react'

import { useQueryContext } from '@audius/common/api'
import { socialMediaMessages } from '@audius/common/messages'
import { Name } from '@audius/common/models'
import { pickHandleSchema } from '@audius/common/schemas'
import { useQueryClient } from '@tanstack/react-query'
import * as signOnActions from 'common/store/pages/signon/actions'
import { useDispatch } from 'react-redux'

import type { SocialButtonProps } from '@audius/harmony-native'
import { SocialButton } from '@audius/harmony-native'
import { restrictedHandles } from 'app/screens/sign-on-screen/utils/restrictedHandles'
import { make, track } from 'app/services/analytics'
import { env } from 'app/services/env'
import { Provider } from 'app/store/oauth/reducer'
import { getInstagramProfile } from 'app/store/oauth/sagas'
import type { InstagramCredentials } from 'app/store/oauth/types'
import { EventNames } from 'app/types/analytics'

import OAuthWebView from '../../../components/oauth/OAuthWebView'

type SignUpFlowInstagramAuthProps = Partial<SocialButtonProps> & {
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'instagram'
  }) => void
  onError: (e: unknown) => void
  onStart?: () => void
  onClose?: () => void
  page: 'create-email' | 'pick-handle'
}

const instagramAppId = env.INSTAGRAM_APP_ID
const instagramRedirectUrl = env.INSTAGRAM_REDIRECT_URL

const signUpFlowInstagramAuthorizeUrl = `https://api.instagram.com/oauth/authorize?client_id=${instagramAppId}&redirect_uri=${encodeURIComponent(
  instagramRedirectUrl
)}&scope=user_profile,user_media&response_type=code`

const useSetProfileFromInstagram = () => {
  const dispatch = useDispatch()
  const queryContext = useQueryContext()
  const queryClient = useQueryClient()

  return async ({ code }: { code: string }) => {
    const res = await getInstagramProfile(code, env.IDENTITY_SERVICE)

    const { igUserProfile: profile } = res
    // Update info in redux
    dispatch(
      signOnActions.setInstagramProfile(
        profile.id,
        profile,
        profile.profile_pic_url_hd
          ? {
              url: profile.profile_pic_url_hd,
              file: {
                uri: profile.profile_pic_url_hd,
                name: 'ProfileImage',
                type: 'image/jpeg'
              }
            }
          : null
      )
    )

    // Check if handle is valid using same schema as handle page
    const handleSchema = pickHandleSchema({
      queryContext,
      queryClient,
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
  onClose,
  page
}: SignUpFlowInstagramAuthProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const setProfileFromInstagram = useSetProfileFromInstagram()

  const handlePress = async () => {
    onStart?.()
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_INSTAGRAM,
        page
      })
    )
    setIsModalOpen(true)
  }

  const handleClose = () => {
    onClose?.()
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_CLOSED_INSTAGRAM,
        page
      })
    )
    setIsModalOpen(false)
  }

  const handleResponse = async (
    payload: InstagramCredentials | { error: string }
  ) => {
    setIsModalOpen(false)
    if ('error' in payload) {
      onError(new Error(payload.error))
      return
    }

    const { code } = payload as InstagramCredentials // already handled error - safe to cast
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
            page,
            isVerified,
            handle: handle || 'unknown'
          })
        )
        onSuccess({ handle, requiresReview, platform: 'instagram' })
      } catch (e) {
        onError(e)
      }
    } else {
      onError(new Error('No auth code in response from Instagram'))
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
        onPress={handlePress}
        aria-label={socialMediaMessages.signUpInstagram}
      />
    </>
  )
}
