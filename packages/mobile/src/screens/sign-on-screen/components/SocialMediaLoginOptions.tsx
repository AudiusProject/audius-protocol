import { socialMediaMessages } from '@audius/common'
import { css } from '@emotion/native'

import { Flex } from '@audius/harmony-native'

import { SignupFlowTikTokAuth } from './SignupFlowTikTokAuth'
import { SocialButton } from './temp-harmony/SocialButton'

type SocialMediaLoginOptionsProps = {
  onCompleteSocialMediaLogin: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter' | 'instagram' | 'tiktok'
  }) => void
  onError: () => void
  onStart: () => void
}

export const SocialMediaLoginOptions = ({
  onCompleteSocialMediaLogin,
  onStart,
  onError
}: SocialMediaLoginOptionsProps) => {
  const handleFailure = () => {
    onError()
    // TODO: toast here
    // toast(socialMediaMessages.verificationError)
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
    // TODO: toast here
    // toast(socialMediaMessages.socialMediaLoginSucess(platform))
    onCompleteSocialMediaLogin({
      handle,
      requiresReview,
      platform
    })
  }

  const isTwitterEnabled = true
  const isInstagramEnabled = true
  const isTikTokEnabled = true
  //   const isTwitterEnabled = useRemoteVar(
  //     BooleanKeys.DISPLAY_TWITTER_VERIFICATION_WEB_AND_DESKTOP
  //   )
  //   const isInstagramEnabled = useRemoteVar(
  //     BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION_WEB_AND_DESKTOP
  //   )
  //   const isTikTokEnabled = useRemoteVar(
  //     BooleanKeys.DISPLAY_TIKTOK_VERIFICATION_WEB_AND_DESKTOP
  //   )
  return (
    <Flex direction='row' gap='s' w='100%'>
      {isTwitterEnabled ? (
        // TODO: replace with harmony component
        <SocialButton
          fullWidth
          socialType='twitter'
          onPress={() => {}}
          accessibilityLabel={socialMediaMessages.signUpTwitter}
          style={css({ flex: 1 })}
        />
      ) : null}
      {isInstagramEnabled ? (
        // TODO: replace with harmony component
        <SocialButton
          fullWidth
          socialType='instagram'
          onPress={() => {}}
          accessibilityLabel={socialMediaMessages.signUpInstagram}
          style={css({ flex: 1 })}
        />
      ) : null}
      {isTikTokEnabled ? (
        // TODO: replace with harmony component
        <SignupFlowTikTokAuth
          onStart={onStart}
          onFailure={handleFailure}
          onSuccess={handleSuccess}
        />
      ) : null}
    </Flex>
  )
}
