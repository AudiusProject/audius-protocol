import { PropsWithChildren } from 'react'

import { socialMediaMessages } from '@audius/common/messages'
import { SocialPlatform } from '@audius/common/models'
import { TwitterProfile } from '@audius/common/store'
import { SerializedStyles } from '@emotion/react'

import { XAuthButton } from 'components/x-auth/XAuthButton'

import { useSetProfileFromTwitter } from '../hooks/socialMediaLogin'

type SignupFlowXAuthProps = PropsWithChildren<{
  onFailure: (e: Error) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'x'
  }) => void
  onStart: (platform: SocialPlatform) => void
  css?: SerializedStyles
}>

export const SignupFlowXAuth = ({
  onFailure,
  onSuccess,
  onStart,
  css
}: SignupFlowXAuthProps) => {
  const setProfileFromTwitter = useSetProfileFromTwitter()

  const handleStart = () => {
    onStart('x')
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
      platform: 'x'
    })
  }

  return (
    <XAuthButton
      forceLogin
      onClick={handleStart}
      onFailure={onFailure}
      onSuccess={(uuid, profile) =>
        handleTwitterLogin({ uuid, twitterProfile: profile })
      }
      aria-label={socialMediaMessages.signUpX}
      css={{ flex: 1, width: '100%', padding: 0 }}
    />
  )
}
