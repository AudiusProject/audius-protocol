import { useEffect } from 'react'

import { useAudiusQueryContext } from '@audius/common/audius-query'
import { Name } from '@audius/common/models'
import { pickHandleSchema } from '@audius/common/schemas'
import { formatTikTokProfile } from '@audius/common/services'
import type { TikTokProfileData } from '@audius/common/services'
import type { GestureResponderEvent } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { restrictedHandles } from 'utils/restrictedHandles'

import { SocialButton } from '@audius/harmony-native'
import { useTikTokAuth } from 'app/hooks/useTikTokAuth'
import { make, track } from 'app/services/analytics'
import * as oauthActions from 'app/store/oauth/actions'
import { getAbandoned } from 'app/store/oauth/selectors'

type SignUpFlowTikTokAuthProps = {
  onStart: () => void
  onFailure: (e: unknown) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'tiktok'
  }) => void
  onClose: () => void
}

// Wrapper around TikTokAuthButton that adds in new sign up schema
export const SignUpFlowTikTokAuth = ({
  onStart,
  onSuccess,
  onFailure,
  onClose
}: SignUpFlowTikTokAuthProps) => {
  const dispatch = useDispatch()
  const abandoned = useSelector(getAbandoned)
  const audiusQueryContext = useAudiusQueryContext()

  useEffect(() => {
    if (abandoned) {
      onClose()
    }
  }, [abandoned, onClose])

  const handleSuccess = async (
    profileData: TikTokProfileData,
    requiresUserReview: boolean
  ) => {
    try {
      const { profile, handleTooLong } = profileData
      const handleSchema = pickHandleSchema({
        audiusQueryContext: audiusQueryContext!,
        skipReservedHandleCheck: profile.is_verified,
        restrictedHandles
      })
      const validationResult = await handleSchema.safeParseAsync({
        handle: profile.username
      })
      const requiresReview =
        (!handleTooLong && !validationResult.success) || requiresUserReview

      track(
        make({
          eventName: Name.CREATE_ACCOUNT_COMPLETE_TIKTOK,
          isVerified: !!profile.is_verified,
          handle: profile.username || 'unknown'
        })
      )
      onSuccess({
        requiresReview,
        handle: profile.username,
        platform: 'tiktok'
      })
    } catch (e) {
      onFailure(e)
    }
  }

  const withTikTokAuth = useTikTokAuth({
    onError: (error) => {
      onFailure(error)
      dispatch(oauthActions.setTikTokError(error))
    }
  })

  const handlePress = (e: GestureResponderEvent) => {
    onStart()
    dispatch(oauthActions.setTikTokError(null))
    withTikTokAuth(async (accessToken: string) => {
      try {
        const fields = [
          'open_id',
          'username',
          'display_name',
          'avatar_large_url',
          'is_verified'
        ]
        const result = await fetch(
          `https://open.tiktokapis.com/v2/user/info/?fields=${fields.join(
            ','
          )}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )

        const resultJson = await result.json()
        const tikTokProfile = resultJson.data.user

        const profileData = await formatTikTokProfile(
          tikTokProfile,
          async (image: File) => image
        )

        const { profile, profileImage, requiresUserReview } = profileData
        dispatch(
          oauthActions.setTikTokInfo(
            tikTokProfile.open_id,
            profile,
            profileImage,
            requiresUserReview
          )
        )
        handleSuccess(profileData, requiresUserReview)
      } catch (e) {
        console.error(e)
      }
    })
  }

  return (
    <SocialButton
      socialType='tiktok'
      onPress={handlePress}
      aria-label='Sign up with TikTok'
    />
  )
}
