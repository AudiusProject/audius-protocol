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
  onCompleteSocialMediaLogin
}: SocialMediaLoginOptionsProps) => {
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
        >
          <SocialButton
            fullWidth
            socialType='tiktok'
            onPress={() => {}}
            accessibilityLabel={socialMediaMessages.signUpTikTok}
            style={css({ flex: 1 })}
          />
        </SignupFlowTikTokAuth>
      ) : null}
    </Flex>
  )
}
