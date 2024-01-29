import { BooleanKeys, useRemoteVar } from '@audius/common'
import { socialMediaMessages } from '@audius/common/messages'

import { Flex } from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'
import { SignUpFlowInstagramAuth } from 'app/screens/sign-on-screen/components/SignUpFlowInstagramAuth'
import { SignUpFlowTwitterAuth } from 'app/screens/sign-on-screen/components/SignUpFlowTwitterAuth'

import { SignUpFlowTikTokAuth } from './SignUpFlowTikTokAuth'

type SocialMediaLoginOptionsProps = {
  onCompleteSocialMediaLogin: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter' | 'instagram' | 'tiktok'
  }) => void
  onError: (e: unknown) => void
  onStart: () => void
  onClose: () => void
}

// Renders all the social buttons + pops up toasts accordingly
export const SocialMediaSignUpButtons = ({
  onCompleteSocialMediaLogin,
  onStart,
  onError,
  onClose
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
          onError={handleFailure}
          onSuccess={handleSuccess}
          onStart={onStart}
          onClose={onClose}
        />
      ) : null}
      {isInstagramEnabled ? (
        <SignUpFlowInstagramAuth
          onError={handleFailure}
          onSuccess={handleSuccess}
          onStart={onStart}
          onClose={onClose}
        />
      ) : null}
      {isTikTokEnabled ? (
        <SignUpFlowTikTokAuth
          onFailure={handleFailure}
          onSuccess={handleSuccess}
          onStart={onStart}
          onClose={onClose}
        />
      ) : null}
    </Flex>
  )
}
