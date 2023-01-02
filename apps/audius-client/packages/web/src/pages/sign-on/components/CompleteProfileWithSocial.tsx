import { useCallback } from 'react'

import {
  BooleanKeys,
  FeatureFlags,
  InstagramProfile,
  TikTokProfile,
  TwitterProfile
} from '@audius/common'
import { IconImage, IconUser, IconVerified } from '@audius/stems'
import cn from 'classnames'
import { Transition } from 'react-spring/renderprops'

import { InstagramAuthButton } from 'components/instagram-auth/InstagramAuthButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { TikTokAuthButton } from 'components/tiktok-auth/TikTokAuthButton'
import { TwitterAuthButton } from 'components/twitter-auth/TwitterAuthButton'
import { useFlag, useRemoteVar } from 'hooks/useRemoteConfig'

import styles from './CompleteProfileWithSocial.module.css'

const messages = {
  instagramButton: 'Complete with Instagram',
  twitterButton: 'Complete with Twitter',
  tiktokButton: 'Complete with TikTok',
  header: 'Quickly Complete Your Account by Linking Your Other Socials',
  importTileHeader: 'We will import these details',
  importTileItemHandle: 'Handle & Display Name',
  importTileItemPicture: 'Profile Picture & Cover Photo',
  verifiedTileHeader: 'Verified?',
  verifiedTileContent:
    'If the linked account is verified, your Audius account will be verified to match!',
  manual: "I'd rather fill out my profile manually"
}

export type CompleteProfileWithSocialProps = {
  displayInstagramRemoteVarKey?: BooleanKeys
  initial: boolean
  isLoading: boolean
  isMobile: boolean
  onClick: () => void
  onFailure: () => void
  onInstagramLogin: (uuid: string, profile: InstagramProfile) => Promise<void>
  onInstagramStart: () => void
  onTikTokLogin: (uuid: string, profile: TikTokProfile) => void
  onTikTokStart: () => void
  onToggleVisible: () => void
  onTwitterLogin: (uuid: string, profile: TwitterProfile) => Promise<void>
  onTwitterStart: () => void
  showCompleteProfileWithSocial: boolean
}

const CompleteProfileWithSocial = (props: CompleteProfileWithSocialProps) => {
  const {
    displayInstagramRemoteVarKey = BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION_WEB_AND_DESKTOP,
    initial,
    isLoading,
    isMobile,
    onClick,
    onFailure,
    onInstagramLogin,
    onInstagramStart,
    onTikTokLogin,
    onTikTokStart,
    onToggleVisible,
    onTwitterLogin,
    onTwitterStart,
    showCompleteProfileWithSocial
  } = props
  const { isEnabled: isTikTokEnabled } = useFlag(
    FeatureFlags.COMPLETE_PROFILE_WITH_TIKTOK
  )
  const displayInstagram = useRemoteVar(displayInstagramRemoteVarKey)

  const handleClickTwitter = useCallback(() => {
    onTwitterStart()
    onClick()
  }, [onTwitterStart, onClick])

  const handleClickInstagram = useCallback(() => {
    onInstagramStart()
    onClick()
  }, [onInstagramStart, onClick])

  const handleClickTikTok = useCallback(() => {
    onTikTokStart()
    onClick()
  }, [onTikTokStart, onClick])

  return (
    <Transition
      items={showCompleteProfileWithSocial}
      from={{ opacity: initial ? 1 : 0 }}
      enter={{ opacity: 1 }}
      leave={{ opacity: 0 }}
      config={{ duration: 100 }}
    >
      {(show) =>
        show &&
        ((transitionProps) => (
          <div
            style={{
              ...transitionProps,
              zIndex: 10,
              width: '100%',
              height: '100%'
            }}
          >
            {isLoading || !showCompleteProfileWithSocial ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner className={styles.loadingSpinner} />
              </div>
            ) : (
              <div
                className={cn(styles.completProfileWithSocialContainer, {
                  [styles.isMobile]: isMobile
                })}
              >
                <h2 className={styles.header}>{messages.header}</h2>
                <div className={styles.tile}>
                  <div className={styles.tileHeader}>
                    {messages.importTileHeader}
                  </div>
                  <ul>
                    <li className={styles.tileListItem}>
                      <div
                        className={cn(
                          styles.tileListItemIcon,
                          styles.tileListItemIconCircle
                        )}
                      >
                        <IconUser />
                      </div>
                      <span>{messages.importTileItemHandle}</span>
                    </li>
                    <li className={styles.tileListItem}>
                      <div
                        className={cn(
                          styles.tileListItemIcon,
                          styles.tileListItemIconCircle
                        )}
                      >
                        <IconImage />
                      </div>
                      <span>{messages.importTileItemPicture}</span>
                    </li>
                  </ul>
                </div>
                <div className={styles.buttonContainer}>
                  <TwitterAuthButton
                    onClick={handleClickTwitter}
                    onFailure={onFailure}
                    onSuccess={onTwitterLogin}
                    text={messages.twitterButton}
                  />
                  {displayInstagram && (
                    <InstagramAuthButton
                      onClick={handleClickInstagram}
                      onFailure={onFailure}
                      onSuccess={onInstagramLogin}
                      text={messages.instagramButton}
                    />
                  )}
                  {isTikTokEnabled ? (
                    <TikTokAuthButton
                      onClick={handleClickTikTok}
                      onFailure={onFailure}
                      onSuccess={onTikTokLogin}
                      text={messages.tiktokButton}
                    />
                  ) : null}
                </div>
                <div className={styles.tile}>
                  <div className={styles.tileHeader}>
                    {messages.verifiedTileHeader}
                  </div>
                  <ul>
                    <li className={styles.tileListItem}>
                      <IconVerified
                        height={24}
                        width={24}
                        className={cn([
                          styles.tileListItemIcon,
                          styles.verifiedIcon
                        ])}
                      />
                      <span>{messages.verifiedTileContent}</span>
                    </li>
                  </ul>
                </div>
                <button className={styles.manualText} onClick={onToggleVisible}>
                  {messages.manual}
                </button>
              </div>
            )}
          </div>
        ))
      }
    </Transition>
  )
}
export default CompleteProfileWithSocial
