import { PropsWithChildren } from 'react'

import { SocialPlatform } from '@audius/common/models'
import { InstagramProfile } from '@audius/common/store'

import InstagramAuth from 'components/instagram-auth/InstagramAuth'

import { useSetProfileFromInstagram } from '../hooks/socialMediaLogin'

type SignupFlowInstagramAuthProps = PropsWithChildren<{
  className?: string
  onFailure: (e: Error) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'instagram'
  }) => void
  onStart: (platform: SocialPlatform) => void
}>

export const SignupFlowInstagramAuth = ({
  className,
  onStart,
  onFailure,
  onSuccess,
  children
}: SignupFlowInstagramAuthProps) => {
  const setProfileFromInstagram = useSetProfileFromInstagram()

  const handleStart = () => {
    onStart('instagram')
  }

  const handleInstagramLogin = async ({
    uuid,
    profile
  }: {
    uuid: string
    profile: InstagramProfile
  }) => {
    let res
    try {
      res = await setProfileFromInstagram({ uuid, instagramProfile: profile })
    } catch (e) {
      onFailure(e as Error)
      return
    }
    onSuccess({
      requiresReview: res.requiresReview,
      handle: res.handle,
      platform: 'instagram'
    })
  }

  return (
    <InstagramAuth
      className={className}
      onClick={handleStart}
      onFailure={onFailure}
      onSuccess={(uuid, profile) => handleInstagramLogin({ uuid, profile })}
    >
      {children}
    </InstagramAuth>
  )
}
