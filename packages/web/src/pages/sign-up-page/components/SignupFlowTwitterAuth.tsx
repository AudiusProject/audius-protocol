import { PropsWithChildren } from 'react'

import { TwitterProfile } from '@audius/common'

import TwitterAuth from 'components/twitter-auth/TwitterAuth'

import { useSetProfileFromTwitter } from '../hooks/socialMediaLogin'

import { SocialPlatform } from './SocialMediaLoginOptions'

type SignupFlowTwitterAuthProps = PropsWithChildren<{
  className?: string
  onFailure: (e: Error, platform: SocialPlatform) => void
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

  const handleError = (e: Error) => {
    console.error(e)
    onFailure(e, 'twitter')
  }

  const handleTwitterLogin = async (params: {
    uuid: string
    twitterProfile: TwitterProfile
  }) => {
    let res
    try {
      res = await setProfileFromTwitter(params)
    } catch (e) {
      handleError(e as Error)
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
      onFailure={handleError}
      onSuccess={(uuid, profile) =>
        handleTwitterLogin({ uuid, twitterProfile: profile })
      }
    >
      {children}
    </TwitterAuth>
  )
}
