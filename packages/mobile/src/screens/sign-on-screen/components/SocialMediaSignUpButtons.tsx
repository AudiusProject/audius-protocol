import { BooleanKeys, useRemoteVar, socialMediaMessages } from '@audius/common'

import { Flex } from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'

import { SignUpFlowInstagramAuth } from './SignUpFlowInstagramAuth'
import { SignUpFlowTikTokAuth } from './SignUpFlowTikTokAuth'
import { SignUpFlowTwitterAuth } from './SignUpFlowTwitterAuth'

type SocialMediaLoginOptionsProps = {
  onCompleteSocialMediaLogin: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter' | 'instagram' | 'tiktok'
  }) => void
  onError: (e: unknown) => void
  onStart: () => void
}

export const SocialMediaSignUpButtons = ({
  onCompleteSocialMediaLogin,
  onStart,
  onError
}: SocialMediaLoginOptionsProps) => {
  const { toast } = useToast()
  const handleFailure = (e: unknown) => {
    onError(e)
    console.error(e)
    toast({ content: socialMediaMessages.verificationError, type: 'error' })
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
    toast({
      content: socialMediaMessages.socialMediaLoginSucess(platform),
      type: 'info'
    })
    onCompleteSocialMediaLogin({
      handle,
      requiresReview,
      platform
    })
  }

  const isTwitterEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_TWITTER_VERIFICATION
  )
  const isInstagramEnabled = useRemoteVar(
    BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION
  )
  const isTikTokEnabled = useRemoteVar(BooleanKeys.DISPLAY_TIKTOK_VERIFICATION)
  return (
    <Flex direction='row' gap='s' w='100%'>
      {isTwitterEnabled ? (
        <SignUpFlowTwitterAuth
          onFailure={handleFailure}
          onSuccess={handleSuccess}
          onStart={onStart}
        />
      ) : null}
      {isInstagramEnabled ? (
        <SignUpFlowInstagramAuth
          onFailure={handleFailure}
          onSuccess={handleSuccess}
          onStart={onStart}
        />
      ) : null}
      {isTikTokEnabled ? (
        <SignUpFlowTikTokAuth
          onFailure={handleFailure}
          onSuccess={handleSuccess}
          onStart={onStart}
        />
      ) : null}
    </Flex>
  )
}
