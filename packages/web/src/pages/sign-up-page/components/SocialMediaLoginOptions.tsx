import { useContext } from 'react'

import { socialMediaMessages } from '@audius/common/messages'
import { SocialPlatform } from '@audius/common/models'
import { BooleanKeys } from '@audius/common/services'
import { Box, Flex, SocialButton } from '@audius/harmony'

import { ToastContext } from 'components/toast/ToastContext'
import { useRemoteVar } from 'hooks/useRemoteConfig'

import { SignupFlowInstagramAuth } from './SignupFlowInstagramAuth'
import { SignupFlowTikTokAuth } from './SignupFlowTikTokAuth'
import { SignupFlowTwitterAuth } from './SignupFlowTwitterAuth'

type SocialMediaLoginOptionsProps = {
  onCompleteSocialMediaLogin: (info: {
    requiresReview: boolean
    handle: string
    platform: SocialPlatform
  }) => void
  onError: (err: Error, platform: SocialPlatform) => void
  onStart: (platform: SocialPlatform) => void
}

export const SocialMediaLoginOptions = ({
  onCompleteSocialMediaLogin,
  onError,
  onStart
}: SocialMediaLoginOptionsProps) => {
  const { toast } = useContext(ToastContext)

  const handleStart = (platform: SocialPlatform) => () => onStart(platform)

  const handleError = (platform: SocialPlatform) => (err: Error) => {
    onError(err, platform)
    const closedByUser = /closed by user/i.test(err.message)
    const isAccountInUseError =
      /Another Audius profile has already been authenticated/i.test(err.message)
    const toastErrMessage = isAccountInUseError
      ? socialMediaMessages.accountInUseError('tiktok')
      : socialMediaMessages.verificationError

    if (!closedByUser) {
      toast(toastErrMessage)
    }
  }

  const handleSuccess = ({
    handle,
    requiresReview,
    platform
  }: {
    requiresReview: boolean
    handle: string
    platform: SocialPlatform
  }) => {
    toast(socialMediaMessages.socialMediaLoginSucess(platform))
    onCompleteSocialMediaLogin({
      handle,
      requiresReview,
      platform
    })
  }
  const isTwitterEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_TWITTER_VERIFICATION_WEB_AND_DESKTOP
  )
  const isInstagramEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION_WEB_AND_DESKTOP
  )
  const isTikTokEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_TIKTOK_VERIFICATION_WEB_AND_DESKTOP
  )
  return (
    <Flex direction='row' gap='s' w='100%'>
      {isTwitterEnabled ? (
        <SignupFlowTwitterAuth
          css={{ flex: 1 }}
          onStart={handleStart('twitter')}
          onFailure={handleError('twitter')}
          onSuccess={handleSuccess}
        >
          <SocialButton
            type='button'
            socialType='twitter'
            css={{ width: '100%' }}
            aria-label={socialMediaMessages.signUpTwitter}
          />
        </SignupFlowTwitterAuth>
      ) : null}
      {isInstagramEnabled ? (
        <SignupFlowInstagramAuth
          css={{ flex: 1 }}
          onStart={handleStart('instagram')}
          onFailure={handleError('instagram')}
          onSuccess={handleSuccess}
        >
          <SocialButton
            type='button'
            socialType='instagram'
            css={{ width: '100%' }}
            aria-label={socialMediaMessages.signUpInstagram}
          />
        </SignupFlowInstagramAuth>
      ) : null}
      {isTikTokEnabled ? (
        <Box css={{ flex: 1 }}>
          <SignupFlowTikTokAuth
            onStart={handleStart('tiktok')}
            onError={handleError('tiktok')}
            onSuccess={handleSuccess}
          >
            <SocialButton
              type='button'
              socialType='tiktok'
              css={{ width: '100%' }}
              aria-label={socialMediaMessages.signUpTikTok}
            />
          </SignupFlowTikTokAuth>
        </Box>
      ) : null}
    </Flex>
  )
}
