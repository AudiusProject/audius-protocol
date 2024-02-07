import { ReactElement } from 'react'

import { TikTokProfile } from '@audius/common/store'

import { TikTokAuth } from 'components/tiktok-auth/TikTokAuthButton'

import { useSetProfileFromTikTok } from '../hooks/socialMediaLogin'

import { SocialPlatform } from './SocialMediaLoginOptions'

type SignupFlowTikTokAuthProps = {
  onStart: (platform: SocialPlatform) => void
  onFailure: (e: Error, platform: SocialPlatform) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'tiktok'
  }) => void
  children: ReactElement
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
    console.error(e)
    onFailure(e, 'tiktok')
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
    <TikTokAuth
      onClick={handleStart}
      onFailure={handleError}
      onSuccess={(uuid, profile) => handleTikTokLogin({ uuid, profile })}
    >
      {children}
    </TikTokAuth>
  )
}
