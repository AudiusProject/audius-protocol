import { ReactElement } from 'react'

import { SocialPlatform } from '@audius/common/models'
import { TikTokProfile } from '@audius/common/store'

import { TikTokAuthButton } from 'components/tiktok-auth/TikTokAuthButton'

import { useSetProfileFromTikTok } from '../hooks/socialMediaLogin'

type SignupFlowTikTokAuthProps = {
  onStart: (platform: SocialPlatform) => void
  onFailure: (e: Error) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'tiktok'
  }) => void
  children?: ReactElement
}

export const SignupFlowTikTokAuth = ({
  onStart,
  onFailure,
  onSuccess,
  children
}: SignupFlowTikTokAuthProps) => {
  const setProfileFromTikTok = useSetProfileFromTikTok()

  const handleStart = () => {
    onStart('tiktok')
  }

  const handleError = (e: Error) => {
    onFailure(e)
  }

  const handleTikTokLogin = async ({
    uuid,
    profile
  }: {
    uuid: string
    profile: TikTokProfile
  }) => {
    let res
    try {
      res = await setProfileFromTikTok({ uuid, tikTokProfile: profile })
    } catch (e) {
      handleError(e as Error)
      return
    }
    onSuccess({
      requiresReview: res.requiresReview,
      handle: res.handle,
      platform: 'tiktok'
    })
  }

  return (
    <TikTokAuthButton
      onClick={handleStart}
      onFailure={handleError}
      onSuccess={(uuid, profile) => handleTikTokLogin({ uuid, profile })}
      css={{ width: '100%', flex: 1, padding: 0 }}
    >
      {children}
    </TikTokAuthButton>
  )
}
