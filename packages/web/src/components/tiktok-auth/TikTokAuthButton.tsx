import { MouseEvent, ReactElement, cloneElement, useCallback } from 'react'

import { Feature } from '@audius/common/models'
import { TikTokProfile } from '@audius/common/store'
import { SocialButton, SocialButtonProps } from '@audius/harmony'

import { useTikTokAuth } from 'hooks/useTikTokAuth'
import { reportToSentry } from 'store/errors/reportToSentry'

type TikTokAuthButtonProps = {
  onFailure: (e: Error) => void
  onSuccess: (uuid: string, profile: TikTokProfile) => void
} & Omit<SocialButtonProps, 'socialType'>

type TikTokAuthProps = Pick<
  TikTokAuthButtonProps,
  'onFailure' | 'onSuccess' | 'onClick'
> & { children: ReactElement }

const TikTokAuthWrapper = ({
  onFailure,
  onSuccess,
  onClick,
  children
}: TikTokAuthProps) => {
  const withTikTokAuth = useTikTokAuth({
    onError: onFailure
  })

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      withTikTokAuth(async (accessToken: string) => {
        try {
          const fields = [
            'open_id',
            'username',
            'display_name',
            'avatar_url',
            'avatar_large_url',
            'profile_deep_link',
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
          onSuccess(tikTokProfile.open_id, tikTokProfile)
        } catch (e) {
          reportToSentry({
            error: e as Error,
            name: 'Sign Up: Failed to get user from TikTok API',
            feature: Feature.SignUp,
            tags: { socialMedia: 'tiktok' }
          })
        }
      })
    },
    [withTikTokAuth, onSuccess, onClick]
  )

  return cloneElement(children, { onClick: handleClick })
}

export const TikTokAuthButton = (props: TikTokAuthButtonProps) => {
  const { onFailure, onSuccess, onClick, ...buttonProps } = props

  return (
    <TikTokAuthWrapper
      onFailure={onFailure}
      onSuccess={onSuccess}
      onClick={onClick}
    >
      <SocialButton socialType='tiktok' {...buttonProps} />
    </TikTokAuthWrapper>
  )
}
