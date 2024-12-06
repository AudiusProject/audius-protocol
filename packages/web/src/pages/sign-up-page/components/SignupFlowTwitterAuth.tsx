import { PropsWithChildren } from 'react'

import { socialMediaMessages } from '@audius/common/messages'
import { SocialPlatform } from '@audius/common/models'
import { TwitterProfile } from '@audius/common/store'
import { SerializedStyles } from '@emotion/react'

import { TwitterAuthButton } from 'components/twitter-auth/TwitterAuthButton'

import { useSetProfileFromTwitter } from '../hooks/socialMediaLogin'

type SignupFlowTwitterAuthProps = PropsWithChildren<{
  onFailure: (e: Error) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter'
  }) => void
  onStart: (platform: SocialPlatform) => void
  css?: SerializedStyles
}>

export const SignupFlowTwitterAuth = ({
  onFailure,
  onSuccess,
  onStart,
  css
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
    <TwitterAuthButton
      forceLogin
      onClick={handleStart}
      onFailure={onFailure}
      onSuccess={(uuid, profile) =>
        handleTwitterLogin({ uuid, twitterProfile: profile })
      }
      aria-label={socialMediaMessages.signUpTwitter}
      css={{ flex: 1, width: '100%', padding: 0 }}
    />
  )
}
