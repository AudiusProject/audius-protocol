import { ReactElement, useCallback } from 'react'

import { View } from 'react-native'

import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconTikTok from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import { IconButton, useLink } from 'app/components/core'
import Skeleton from 'app/components/skeleton'
import { makeStyles } from 'app/styles/makeStyles'
import { EventNames } from 'app/types/analytics'
import { make, track } from 'app/utils/analytics'

import { ProfileBadge } from './ProfileBadge'
import { useSelectProfile } from './selectors'

const useStyles = makeStyles(({ palette, spacing }) => ({
  socials: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    height: 20,
    width: 20,
    marginRight: spacing(4),
    fill: palette.neutral
  }
}))

export const ProfileSocials = () => {
  const { handle, twitter_handle, instagram_handle, tiktok_handle } =
    useSelectProfile([
      'handle',
      'twitter_handle',
      'instagram_handle',
      'tiktok_handle'
    ])

  const styles = useStyles()
  const sanitizedHandle = handle.replace('@', '')

  const { onPress: onPressTwitter } = useLink(
    `https://twitter.com/${twitter_handle}`
  )

  const { onPress: onPressInstagram } = useLink(
    `https://instagram.com/${instagram_handle}`
  )

  const { onPress: onPressTikTok } = useLink(
    `https://tiktok.com/@${tiktok_handle}`
  )

  const handlePressTwitter = useCallback(() => {
    track(
      make({
        eventName: EventNames.PROFILE_PAGE_CLICK_TWITTER,
        handle: sanitizedHandle,
        twitterHandle: twitter_handle as string
      })
    )
    onPressTwitter()
  }, [onPressTwitter, sanitizedHandle, twitter_handle])

  const handlePressInstagram = useCallback(() => {
    track(
      make({
        eventName: EventNames.PROFILE_PAGE_CLICK_INSTAGRAM,
        handle: sanitizedHandle,
        instagramHandle: instagram_handle as string
      })
    )
    onPressInstagram()
  }, [onPressInstagram, sanitizedHandle, instagram_handle])

  const handlePressTikTok = useCallback(() => {
    track(
      make({
        eventName: EventNames.PROFILE_PAGE_CLICK_TIKTOK,
        handle: sanitizedHandle,
        tikTokHandle: tiktok_handle as string
      })
    )
    onPressTikTok()
  }, [onPressTikTok, sanitizedHandle, tiktok_handle])

  const renderSocial = (
    handle: string | undefined | null,
    socialElement: ReactElement
  ) => {
    if (handle === undefined) return <Skeleton style={styles.icon} />
    if (handle === null || handle === '') return null
    return socialElement
  }

  return (
    <View pointerEvents='box-none' style={styles.socials}>
      <ProfileBadge />
      {renderSocial(
        twitter_handle,
        <IconButton
          icon={IconTwitterBird}
          styles={{ icon: styles.icon }}
          onPress={handlePressTwitter}
        />
      )}
      {renderSocial(
        instagram_handle,
        <IconButton
          icon={IconInstagram}
          styles={{ icon: styles.icon }}
          onPress={handlePressInstagram}
        />
      )}
      {renderSocial(
        tiktok_handle,
        <IconButton
          icon={IconTikTok}
          styles={{ icon: styles.icon }}
          onPress={handlePressTikTok}
        />
      )}
    </View>
  )
}
