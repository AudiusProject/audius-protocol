import { useContext } from 'react'

import { Box, Flex, SocialButton } from '@audius/harmony'

import { ToastContext } from 'components/toast/ToastContext'

import { messages } from '../utils/socialMediaMessages'

import { SignupFlowInstagramAuth } from './SignupFlowInstagramAuth'
import { SignupFlowTikTokAuth } from './SignupFlowTikTokAuth'
import { SignupFlowTwitterAuth } from './SignupFlowTwitterAuth'
import styles from './SocialMediaLoginOptions.module.css'

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
    toast(messages.verificationError)
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
    toast(messages.socialMediaLoginSucess(platform))
    onCompleteSocialMediaLogin({
      handle,
      requiresReview,
      platform
    })
  }

  return (
    <Flex direction='row' gap='s' w='100%'>
      <SignupFlowTwitterAuth
        className={styles.flex1}
        onFailure={handleFailure}
        onSuccess={handleSuccess}
      >
        <SocialButton
          type='button'
          fullWidth
          socialType='twitter'
          aria-label={messages.signUpTwitter}
        />
      </SignupFlowTwitterAuth>
      <SignupFlowInstagramAuth
        className={styles.flex1}
        onFailure={handleFailure}
        onSuccess={handleSuccess}
      >
        <SocialButton
          type='button'
          fullWidth
          socialType='instagram'
          className={styles.flex1}
          aria-label={messages.signUpInstagram}
        />
      </SignupFlowInstagramAuth>
      <Box className={styles.flex1}>
        <SignupFlowTikTokAuth
          onFailure={handleFailure}
          onSuccess={handleSuccess}
        >
          <SocialButton
            type='button'
            fullWidth
            socialType='tiktok'
            aria-label={messages.signUpTikTok}
          />
        </SignupFlowTikTokAuth>
      </Box>
    </Flex>
  )
}
