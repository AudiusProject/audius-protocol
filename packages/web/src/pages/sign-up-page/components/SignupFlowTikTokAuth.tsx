import { ReactElement } from 'react'

import { TikTokProfile } from '@audius/common'

import { TikTokAuth } from 'components/tiktok-auth/TikTokAuthButton'

import { useSetProfileFromTikTok } from '../hooks/socialMediaLogin'

type SignupFlowTikTokAuthProps = {
  onStart: () => void
  onFailure: (e: unknown) => void
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

  const handleError = (e: unknown) => {
    console.error(e)
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
      handleError(e)
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
      onClick={onStart}
      onFailure={handleError}
      onSuccess={(uuid, profile) => handleTikTokLogin({ uuid, profile })}
    >
      {children}
    </TikTokAuth>
  )
}
