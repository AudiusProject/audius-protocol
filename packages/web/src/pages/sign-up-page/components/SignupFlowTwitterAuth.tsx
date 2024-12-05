import { PropsWithChildren } from 'react'

import { SocialPlatform } from '@audius/common/models'
import { TwitterProfile } from '@audius/common/store'

import { TwitterAuth } from 'components/twitter-auth/TwitterAuth'

import { useSetProfileFromTwitter } from '../hooks/socialMediaLogin'

type SignupFlowTwitterAuthProps = PropsWithChildren<{
  className?: string
  onFailure: (e: Error) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter'
  }) => void
  onStart: (platform: SocialPlatform) => void
}>

export const SignupFlowTwitterAuth = ({
  className,
  onFailure,
  onSuccess,
  onStart,
  children
}: SignupFlowTwitterAuthProps) => {
  const setProfileFromTwitter = useSetProfileFromTwitter()

  const handleStart = () => {
    onStart('twitter')
  }

  const handleTwitterLogin = async (params: {
    uuid: string
    twitterProfile: TwitterProfile
  }) => {
    let res
    try {
      res = await setProfileFromTwitter(params)
    } catch (e) {
      onFailure(e as Error)
      return
    }
    onSuccess({
      requiresReview: res.requiresReview,
      handle: res.handle,
      platform: 'twitter'
    })
  }

  return (
    <TwitterAuth
      className={className}
      forceLogin
      onClick={handleStart}
      onFailure={onFailure}
      onSuccess={(uuid, profile) =>
        handleTwitterLogin({ uuid, twitterProfile: profile })
      }
    >
      {children}
    </TwitterAuth>
  )
}
