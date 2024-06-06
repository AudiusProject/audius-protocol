import { useCallback, useState } from 'react'

import type { Nullable } from '@audius/common/utils'
import type { StyleProp, ViewStyle } from 'react-native'

import type { IconButtonProps } from '@audius/harmony-native'
import {
  IconInstagram,
  IconTikTok,
  IconTwitter,
  Text
} from '@audius/harmony-native'
import type { LinkProps } from 'app/components/core'
import { Link, UserGeneratedText } from 'app/components/core'
import { make } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'

import { useSelectProfile } from '../selectors'

const useStyles = makeStyles(({ spacing }) => ({
  iconSkeleton: {
    height: 24,
    width: 24
  },
  linkSkeleton: {
    height: 24,
    width: 150,
    marginLeft: spacing(3)
  },
  withText: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing(2)
  }
}))

export type SocialLinkProps = LinkProps &
  Pick<IconButtonProps, 'icon'> & {
    style?: StyleProp<ViewStyle>
    text: Nullable<string>
    showText?: boolean
    hyperlink?: boolean
  }

export const SocialLink = (props: SocialLinkProps) => {
  const { text, showText, url, icon: Icon, hyperlink, style, ...other } = props
  const styles = useStyles()
  const [isActive, setIsActive] = useState(false)

  const handlePressIn = useCallback(() => {
    setIsActive(true)
  }, [])

  const handlePressOut = useCallback(() => {
    setIsActive(false)
  }, [])

  if (text === null || text === '') return null

  const iconButtonElement = <Icon color={isActive ? 'active' : 'default'} />

  if (showText)
    return (
      <Link
        url={url}
        style={[styles.withText, style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...other}
      >
        {iconButtonElement}
        {hyperlink ? (
          <UserGeneratedText variant='body' source='profile page'>
            {text}
          </UserGeneratedText>
        ) : (
          <Text
            variant='body'
            numberOfLines={1}
            color={isActive ? 'active' : 'default'}
          >
            {text}
          </Text>
        )}
      </Link>
    )

  return (
    <Link
      url={url}
      style={style}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {iconButtonElement}
    </Link>
  )
}

type TwitterSocialLinkProps = Partial<SocialLinkProps>

export const TwitterSocialLink = (props: TwitterSocialLinkProps) => {
  const { handle, twitter_handle } = useSelectProfile([
    'handle',
    'twitter_handle'
  ])

  const sanitizedHandle = handle.replace('@', '')

  return (
    <SocialLink
      url={`https://twitter.com/${twitter_handle}`}
      text={twitter_handle ? `@${twitter_handle}` : twitter_handle}
      icon={IconTwitter}
      analytics={make({
        eventName: EventNames.PROFILE_PAGE_CLICK_TWITTER,
        handle: sanitizedHandle,
        twitterHandle: twitter_handle as string
      })}
      {...props}
    />
  )
}

type InstagramSocialLinkProps = Partial<SocialLinkProps>

export const InstagramSocialLink = (props: InstagramSocialLinkProps) => {
  const { handle, instagram_handle } = useSelectProfile([
    'handle',
    'instagram_handle'
  ])

  const sanitizedHandle = handle.replace('@', '')

  return (
    <SocialLink
      url={`https://instagram.com/${instagram_handle}`}
      text={instagram_handle ? `@${instagram_handle}` : instagram_handle}
      icon={IconInstagram}
      analytics={make({
        eventName: EventNames.PROFILE_PAGE_CLICK_INSTAGRAM,
        handle: sanitizedHandle,
        instagramHandle: instagram_handle as string
      })}
      {...props}
    />
  )
}

type TikTokSocialLinkProps = Partial<SocialLinkProps>

export const TikTokSocialLink = (props: TikTokSocialLinkProps) => {
  const { handle, tiktok_handle } = useSelectProfile([
    'handle',
    'tiktok_handle'
  ])

  const sanitizedHandle = handle.replace('@', '')

  return (
    <SocialLink
      url={`https://tiktok.com/@${tiktok_handle}`}
      text={tiktok_handle ? `@${tiktok_handle}` : tiktok_handle}
      icon={IconTikTok}
      analytics={make({
        eventName: EventNames.PROFILE_PAGE_CLICK_TIKTOK,
        handle: sanitizedHandle,
        tikTokHandle: tiktok_handle as string
      })}
      {...props}
    />
  )
}
