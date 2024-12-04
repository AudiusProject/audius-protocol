import { useRemoteVar } from '@audius/common/hooks'
import { socialMediaMessages } from '@audius/common/messages'
import type { SocialPlatform } from '@audius/common/models'
import { CoreFlow, ErrorLevel } from '@audius/common/models'
import { BooleanKeys } from '@audius/common/services'

import { Flex } from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'
import { SignUpFlowInstagramAuth } from 'app/screens/sign-on-screen/components/SignUpFlowInstagramAuth'
import { SignUpFlowTwitterAuth } from 'app/screens/sign-on-screen/components/SignUpFlowTwitterAuth'
import { reportToSentry } from 'app/utils/reportToSentry'

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
  const handleFailure =
    (platform: SocialPlatform) =>
    (e: Error | any, additionalInfo?: Record<any, any>) => {
      onError(e)
      reportToSentry({
        level: ErrorLevel.Error,
        error: e as Error,
        name: 'Sign Up: Social Media Error',
        coreFlow: CoreFlow.SignUp,
        additionalInfo: { page, platform, ...additionalInfo }
      })

      const isAccountInUseError =
        /Another Audius profile has already been authenticated/i.test(e.message)
      const toastErrMessage = isAccountInUseError
        ? socialMediaMessages.accountInUseError(platform)
        : socialMediaMessages.verificationError
      toast({
        content: toastErrMessage,
        type: 'error'
      })
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
          onError={handleFailure('twitter')}
          onSuccess={handleSuccess}
          onStart={onStart}
          onClose={onClose}
          page={page}
        />
      ) : null}
      {isInstagramEnabled ? (
        <SignUpFlowInstagramAuth
          onError={handleFailure('instagram')}
          onSuccess={handleSuccess}
          onStart={onStart}
          onClose={onClose}
          page={page}
        />
      ) : null}
      {isTikTokEnabled ? (
        <SignUpFlowTikTokAuth
          onFailure={handleFailure('tiktok')}
          onSuccess={handleSuccess}
          onStart={onStart}
          onClose={onClose}
          page={page}
        />
      ) : null}
    </Flex>
  )
}
