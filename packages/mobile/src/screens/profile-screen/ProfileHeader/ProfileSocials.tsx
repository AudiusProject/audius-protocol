import { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from 'react'

import { cacheUsersActions } from '@audius/common'
import { useSelectTierInfo } from '@audius/common/hooks'
import { View, Animated } from 'react-native'
import { useDispatch } from 'react-redux'

import { Divider } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import { useSelectProfile } from '../selectors'

import { ProfileTierTile } from './ProfileTierTile'
import {
  InstagramSocialLink,
  TikTokSocialLink,
  TwitterSocialLink
} from './SocialLink'

const { fetchUserSocials } = cacheUsersActions

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50
  },
  audioTier: {
    paddingLeft: spacing(3)
  },
  socials: {
    flexDirection: 'row',
    flex: 4,
    marginVertical: spacing(3)
  },
  socialsCentered: {
    justifyContent: 'center'
  },
  divider: {
    marginVertical: spacing(1)
  }
}))

export const ProfileSocials = () => {
  const { handle, user_id, twitter_handle, instagram_handle, tiktok_handle } =
    useSelectProfile([
      'handle',
      'user_id',
      'twitter_handle',
      'instagram_handle',
      'tiktok_handle'
    ])

  const dispatch = useDispatch()

  useEffect(() => {
    if (twitter_handle === undefined) {
      dispatch(fetchUserSocials(handle))
    }
  }, [twitter_handle, dispatch, handle])

  const socialLinks = useMemo(() => {
    const links = [
      {
        type: 'twitter',
        handle: twitter_handle,
        SocialLink: TwitterSocialLink
      },
      {
        type: 'instagram',
        handle: instagram_handle,
        SocialLink: InstagramSocialLink
      },
      { type: 'tiktok', handle: tiktok_handle, SocialLink: TikTokSocialLink }
    ]
    return links.filter(({ handle }) => !(handle === null || handle === ''))
  }, [twitter_handle, instagram_handle, tiktok_handle])

  const socialsCount = useMemo(() => {
    return socialLinks.filter(({ handle }) => !!handle).length
  }, [socialLinks])

  const styles = useStyles()

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

  // Renders a single social link with handle text, or renders 2/3 social links
  // with dividers
  const renderSocialLinks = () => {
    if (socialsCount === 1) {
      const { SocialLink } = socialLinks[0]
      return <SocialLink showText />
    }

    return socialLinks.map(({ type, SocialLink }, index) => (
      <Fragment key={type}>
        <SocialLink showText={socialsCount === 1} />
        {index === socialLinks.length - 1 ? null : (
          <Divider
            orientation='vertical'
            style={[
              styles.divider,
              { marginHorizontal: spacing(socialsCount === 2 ? 6 : 4) }
            ]}
          />
        )}
      </Fragment>
    ))
  }

  return (
    <View pointerEvents='box-none' style={styles.root}>
      {tier !== 'none' ? (
        <ProfileTierTile interactive={false} style={styles.audioTier} />
      ) : null}
      <Animated.View
        pointerEvents='box-none'
        style={[
          styles.socials,
          tier !== 'none' ? styles.socialsCentered : null,
          { opacity }
        ]}
      >
        {renderSocialLinks()}
      </Animated.View>
    </View>
  )
}
