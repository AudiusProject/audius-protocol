import { formatTikTokProfile } from '@audius/common'
import type { GestureResponderEvent } from 'react-native'
import { useDispatch } from 'react-redux'

import IconTikTok from 'app/assets/images/iconTikTokInverted.svg'
import { useTikTokAuth } from 'app/hooks/useTikTokAuth'
import * as oauthActions from 'app/store/oauth/actions'

import { SocialButton } from '../social-button'
import type { SocialButtonProps } from '../social-button/SocialButton'

type TikTokAuthButtonProps = SocialButtonProps

export const TikTokAuthButton = (props: TikTokAuthButtonProps) => {
  const { onPress, ...buttonProps } = props
  const dispatch = useDispatch()

  const withTikTokAuth = useTikTokAuth({
    onError: (error) => {
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

        const { profile, profileImage, requiresUserReview } =
          await formatTikTokProfile(tikTokProfile, async (image: File) => image)

        dispatch(
          oauthActions.setTikTokInfo(
            tikTokProfile.open_id,
            profile,
            profileImage,
            requiresUserReview
          )
        )
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
      {...buttonProps}
    />
  )
}
