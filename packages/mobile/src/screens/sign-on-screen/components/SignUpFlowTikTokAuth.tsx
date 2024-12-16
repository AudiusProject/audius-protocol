import { useEffect, useState } from 'react'

import { useAudiusQueryContext } from '@audius/common/audius-query'
import { ErrorLevel, Name } from '@audius/common/models'
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
import { getAbandoned, getIsOpen } from 'app/store/oauth/selectors'
import { reportToSentry } from 'app/utils/reportToSentry'

type SignUpFlowTikTokAuthProps = {
  onStart: () => void
  onError: (e: unknown) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'tiktok'
  }) => void
  onClose: () => void
  page: 'create-email' | 'pick-handle'
}

// Wrapper around TikTokAuthButton that adds in new sign up schema
export const SignUpFlowTikTokAuth = ({
  onStart,
  onSuccess,
  onError,
  onClose,
  page
}: SignUpFlowTikTokAuthProps) => {
  const dispatch = useDispatch()
  const abandoned = useSelector(getAbandoned)
  const isOpen = useSelector(getIsOpen)

  const [tikTokOpen, setTikTokOpen] = useState(false)
  const audiusQueryContext = useAudiusQueryContext()

  useEffect(() => {
    if (!isOpen && abandoned && tikTokOpen) {
      track(
        make({
          eventName: Name.CREATE_ACCOUNT_CLOSED_TIKTOK,
          page
        })
      )
      setTikTokOpen(false)
      onClose()
    }
  }, [abandoned, isOpen, onClose, page, tikTokOpen])

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
          page,
          handle: profile.username || 'unknown'
        })
      )
      onSuccess({
        requiresReview,
        handle: profile.username,
        platform: 'tiktok'
      })
    } catch (e) {
      reportToSentry({
        error: e as Error,
        name: 'Sign Up: Failed to parse TikTok profile data',
        additionalInfo: {
          profileData,
          requiresUserReview
        },
        tags: {
          socialMedia: 'tiktok'
        }
      })
      onError(e)
    }
  }

  const withTikTokAuth = useTikTokAuth({
    onError: (error) => {
      onError(error)
      setTikTokOpen(false)
      dispatch(oauthActions.setTikTokError(error))
    }
  })

  const handlePress = (e: GestureResponderEvent) => {
    setTikTokOpen(true)
    onStart()
    track(
      make({
        eventName: Name.CREATE_ACCOUNT_START_TIKTOK,
        page
      })
    )
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
        onError(e)
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
