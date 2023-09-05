import { Fragment, useLayoutEffect, useMemo, useRef } from 'react'

import { useSelectTierInfo } from '@audius/common'
import { View, Animated } from 'react-native'

import { Divider } from 'app/components/core'
import { makeStyles } from 'app/styles/makeStyles'

import { useSelectProfile } from '../selectors'

import { ProfileTierTile } from './ProfileTierTile'
import {
  InstagramSocialLink,
  TikTokSocialLink,
  TwitterSocialLink
} from './SocialLink'

const useStyles = makeStyles(({ spacing }, { socialsCount }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(3)
  },
  socials: {
    flexDirection: 'row',
    flex: 4,
    marginVertical: spacing(3)
  },
  divider: {
    marginVertical: spacing(1),
    marginHorizontal: spacing(socialsCount === 2 ? 6 : 4)
  }
}))

export const ProfileSocials = () => {
  const { user_id, twitter_handle, instagram_handle, tiktok_handle } =
    useSelectProfile([
      'user_id',
      'twitter_handle',
      'instagram_handle',
      'tiktok_handle'
    ])

  const socialLinks = useMemo(() => {
    const links = [
      [twitter_handle, 'twitter', TwitterSocialLink],
      [instagram_handle, 'instagram', InstagramSocialLink],
      [tiktok_handle, 'tiktok', TikTokSocialLink]
    ] as const
    return links.filter(([handle]) => !(handle === null || handle === ''))
  }, [twitter_handle, instagram_handle, tiktok_handle])

  const socialsCount = useMemo(() => {
    return socialLinks.filter(([handle]) => !!handle).length
  }, [socialLinks])

  const stylesOptions = useMemo(() => ({ socialsCount }), [socialsCount])
  const styles = useStyles(stylesOptions)

  const { tier } = useSelectTierInfo(user_id)

  // Need to start opacity at 1 so skeleton is visible.
  const opacity = useRef(new Animated.Value(1)).current
  useLayoutEffect(() => {
    if (socialsCount > 0) {
      opacity.setValue(0.2)
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start()
    }
  }, [opacity, socialsCount])

  return (
    <View pointerEvents='box-none' style={styles.root}>
      <ProfileTierTile interactive={false} />
      <Animated.View
        pointerEvents='box-none'
        style={[
          styles.socials,
          tier !== 'none' && { justifyContent: 'center' },
          { opacity }
        ]}
      >
        {socialLinks.map(([, name, SocialLink], index) => {
          return (
            <Fragment key={name}>
              <SocialLink showText={socialsCount === 1} />
              {index === socialLinks.length - 1 ? null : (
                <Divider orientation='vertical' style={styles.divider} />
              )}
            </Fragment>
          )
        })}
      </Animated.View>
    </View>
  )
}
