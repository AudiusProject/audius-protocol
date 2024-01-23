import { PropsWithChildren } from 'react'

import { InstagramProfile } from '@audius/common'

import InstagramAuth from 'components/instagram-auth/InstagramAuth'

import { useSetProfileFromInstagram } from '../hooks/socialMediaLogin'

import { SocialPlatform } from './SocialMediaLoginOptions'

type SignupFlowInstagramAuthProps = PropsWithChildren<{
  className?: string
  onFailure: (e: Error, platform: SocialPlatform) => void
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

  const handleError = (e: Error) => {
    console.error(e)
    onFailure(e, 'instagram')
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
      handleError(e as Error)
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
      onFailure={handleError}
      onSuccess={(uuid, profile) => handleInstagramLogin({ uuid, profile })}
    >
      {children}
    </InstagramAuth>
  )
}
