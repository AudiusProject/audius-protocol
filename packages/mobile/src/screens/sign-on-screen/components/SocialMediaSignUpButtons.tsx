import { useRemoteVar } from '@audius/common/hooks'
import { socialMediaMessages } from '@audius/common/messages'
import type { SocialPlatform } from '@audius/common/models'
import { BooleanKeys } from '@audius/common/services'

import { Flex } from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'
import { SignUpFlowInstagramAuth } from 'app/screens/sign-on-screen/components/SignUpFlowInstagramAuth'
import { SignUpFlowTwitterAuth } from 'app/screens/sign-on-screen/components/SignUpFlowTwitterAuth'

import { SignUpFlowTikTokAuth } from './SignUpFlowTikTokAuth'

type SocialMediaLoginOptionsProps = {
  onCompleteSocialMediaLogin: (info: {
    requiresReview: boolean
    handle: string
    platform: SocialPlatform
  }) => void
  onError: (e: unknown) => void
  onStart: () => void
  onClose: () => void
  page: 'create-email' | 'pick-handle'
}

// Renders all the social buttons + pops up toasts accordingly
export const SocialMediaSignUpButtons = ({
  onCompleteSocialMediaLogin,
  onStart,
  onError,
  onClose,
  page
}: SocialMediaLoginOptionsProps) => {
  const { toast } = useToast()
  const handleError = (platform: SocialPlatform) => (e: Error | any) => {
    const isAccountInUseError =
      /Another Audius profile has already been authenticated/i.test(e.message)
    const toastErrMessage = isAccountInUseError
      ? socialMediaMessages.accountInUseError(platform)
      : socialMediaMessages.verificationError
    toast({
      content: toastErrMessage,
      type: 'error'
    })
    onError(e)
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
          onError={handleError('twitter')}
          onSuccess={handleSuccess}
          onStart={onStart}
          onClose={onClose}
          page={page}
        />
      ) : null}
      {isInstagramEnabled ? (
        <SignUpFlowInstagramAuth
          onError={handleError('instagram')}
          onSuccess={handleSuccess}
          onStart={onStart}
          onClose={onClose}
          page={page}
        />
      ) : null}
      {isTikTokEnabled ? (
        <SignUpFlowTikTokAuth
          onError={handleError('tiktok')}
          onSuccess={handleSuccess}
          onStart={onStart}
          onClose={onClose}
          page={page}
        />
      ) : null}
    </Flex>
  )
}
