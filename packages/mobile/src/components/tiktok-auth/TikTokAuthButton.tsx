import type { TikTokProfileData } from '@audius/common/services'
import { formatTikTokProfile } from '@audius/common/services'
import type { GestureResponderEvent } from 'react-native'
import { useDispatch } from 'react-redux'

import { IconTikTok } from '@audius/harmony-native'
import { useTikTokAuth } from 'app/hooks/useTikTokAuth'
import * as oauthActions from 'app/store/oauth/actions'

import { SocialButton } from '../social-button'
import type { SocialButtonProps } from '../social-button/SocialButton'

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
        // Using TikTok v1 api because v2 does not have CORS headers set
        const result = await fetch(
          `https://open-api.tiktok.com/user/info/?access_token=${accessToken}`,
          {
            method: 'POST',
            body: JSON.stringify({
              fields: [
                'open_id',
                'username',
                'display_name',
                'avatar_large_url',
                'is_verified'
              ]
            })
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
      color={'#FE2C55'}
      fullWidth
      icon={IconTikTok}
      onPress={handleTikTokPress}
      title='Sign up with TikTok'
      noText
      {...buttonProps}
    />
  )
}
