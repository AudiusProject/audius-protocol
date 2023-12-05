import { useContext } from 'react'

import { BooleanKeys, socialMediaMessages } from '@audius/common'
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
    platform: 'twitter' | 'instagram' | 'tiktok'
  }) => void
}

export const SocialMediaLoginOptions = ({
  onCompleteSocialMediaLogin
}: SocialMediaLoginOptionsProps) => {
  const { toast } = useContext(ToastContext)
  const handleFailure = () => {
    toast(socialMediaMessages.verificationError)
  }

  const handleSuccess = ({
    handle,
    requiresReview,
    platform
  }: {
    requiresReview: boolean
    handle: string
    platform: 'twitter' | 'instagram' | 'tiktok'
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
          onFailure={handleFailure}
          onSuccess={handleSuccess}
        >
          <SocialButton
            type='button'
            fullWidth
            socialType='twitter'
            aria-label={socialMediaMessages.signUpTwitter}
          />
        </SignupFlowTwitterAuth>
      ) : null}
      {isInstagramEnabled ? (
        <SignupFlowInstagramAuth
          css={{ flex: 1 }}
          onFailure={handleFailure}
          onSuccess={handleSuccess}
        >
          <SocialButton
            type='button'
            fullWidth
            socialType='instagram'
            css={{ flex: 1 }}
            aria-label={socialMediaMessages.signUpInstagram}
          />
        </SignupFlowInstagramAuth>
      ) : null}
      {isTikTokEnabled ? (
        <Box css={{ flex: 1 }}>
          <SignupFlowTikTokAuth
            onFailure={handleFailure}
            onSuccess={handleSuccess}
          >
            <SocialButton
              type='button'
              fullWidth
              socialType='tiktok'
              aria-label={socialMediaMessages.signUpTikTok}
            />
          </SignupFlowTikTokAuth>
        </Box>
      ) : null}
    </Flex>
  )
}
