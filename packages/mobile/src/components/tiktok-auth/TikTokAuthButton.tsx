import type { TikTokProfileData } from '@audius/common/services'
import { formatTikTokProfile } from '@audius/common/services'
import type { GestureResponderEvent } from 'react-native'
import { useDispatch } from 'react-redux'

import type { SocialButtonProps } from '@audius/harmony-native'
import { SocialButton } from '@audius/harmony-native'
import { useTikTokAuth } from 'app/hooks/useTikTokAuth'
import * as oauthActions from 'app/store/oauth/actions'

type TikTokAuthButtonProps = Partial<SocialButtonProps> & {
  onSuccess?: ({
    profileData,
    requiresReview
  }: {
    profileData: TikTokProfileData
    requiresReview: boolean
  }) => void
  onError?: (e: unknown) => void
  onClose?: () => void
}

export const TikTokAuthButton = (props: TikTokAuthButtonProps) => {
  const { onPress, onSuccess, onError, ...buttonProps } = props
  const dispatch = useDispatch()

  const withTikTokAuth = useTikTokAuth({
    onError: (error) => {
      onError?.(error)
      dispatch(oauthActions.setTikTokError(error))
    }
  })

  const handleTikTokPress = (e: GestureResponderEvent) => {
    onPress?.(e)
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
        onSuccess?.({
          requiresReview: requiresUserReview,
          profileData
        })
      } catch (e) {
        console.error(e)
      }
    })
  }

  return (
    <SocialButton
      aria-label='Sign up with TikTok'
      socialType='tiktok'
      fullWidth
      onPress={handleTikTokPress}
      {...buttonProps}
    />
  )
}
