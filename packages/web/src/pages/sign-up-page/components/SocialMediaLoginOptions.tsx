import {
  InstagramProfile,
  Name,
  TikTokProfile,
  TwitterProfile
} from '@audius/common'
import { Box, Flex, SocialButton } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import InstagramAuth from 'components/instagram-auth/InstagramAuth'
import { TikTokAuth } from 'components/tiktok-auth/TikTokAuthButton'
import TwitterAuth from 'components/twitter-auth/TwitterAuth'

import styles from './SocialMediaLoginOptions.module.css'

type SocialMediaLoginOptionsProps = {
  onTwitterLogin: (params: {
    uuid: string
    twitterProfile: TwitterProfile
  }) => void
  onLoginFailure: (error: any) => void
  onInstagramLogin: (params: {
    uuid: string
    instagramProfile: InstagramProfile
  }) => void
  onTikTokLogin: (params: {
    uuid: string
    tikTokProfile: TikTokProfile
  }) => void
}

export const SocialMediaLoginOptions = ({
  onTwitterLogin,
  onTikTokLogin,
  onInstagramLogin,
  onLoginFailure
}: SocialMediaLoginOptionsProps) => {
  const dispatch = useDispatch()
  return (
    <Flex direction='row' gap='s' w='100%'>
      <TwitterAuth
        className={styles.flex1}
        forceLogin
        onClick={() => {
          dispatch(make(Name.CREATE_ACCOUNT_START_TWITTER, {}))
        }}
        onFailure={onLoginFailure}
        onSuccess={(uuid, profile) =>
          onTwitterLogin({ uuid, twitterProfile: profile })
        }
      >
        <SocialButton
          fullWidth
          socialType='twitter'
          aria-label='Sign up with Twitter'
        />
      </TwitterAuth>
      <InstagramAuth
        className={styles.flex1}
        onFailure={onLoginFailure}
        onSuccess={(uuid, profile) =>
          onInstagramLogin({ uuid, instagramProfile: profile })
        }
      >
        <SocialButton
          fullWidth
          socialType='instagram'
          className={styles.flex1}
          aria-label='Sign up with Instagram'
        />
      </InstagramAuth>
      <Box className={styles.flex1}>
        <TikTokAuth
          onFailure={onLoginFailure}
          onSuccess={(uuid, profile) =>
            onTikTokLogin({ uuid, tikTokProfile: profile })
          }
        >
          <SocialButton
            fullWidth
            socialType='tiktok'
            aria-label='Sign up with TikTok'
          />
        </TikTokAuth>
      </Box>
    </Flex>
  )
}
