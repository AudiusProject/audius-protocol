import { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from 'react'

import { useSelectTierInfo } from '@audius/common/hooks'
import { cacheUsersActions } from '@audius/common/store'
import { View, Animated } from 'react-native'
import { useDispatch } from 'react-redux'

import { Divider } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'

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
    alignItems: 'center'
  },
  socials: {
    flexDirection: 'row',
    flex: 4
  },
  socialsCentered: {
    justifyContent: 'center'
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
    dispatch(fetchUserSocials(handle))
  }, [dispatch, handle])

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
            mv='xs'
            mh={socialsCount === 2 ? 's' : 'xs'}
          />
        )}
      </Fragment>
    ))
  }
  return (
    <View pointerEvents='box-none' style={styles.root}>
      {tier !== 'none' ? <ProfileTierTile interactive={false} /> : null}
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
