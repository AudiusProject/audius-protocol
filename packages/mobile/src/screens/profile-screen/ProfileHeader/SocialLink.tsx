import { useCallback, useState } from 'react'

import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import type { IconButtonProps } from '@audius/harmony-native'
import { IconInstagram, IconTikTok, IconTwitter } from '@audius/harmony-native'
import type { LinkProps } from 'app/components/core'
import { Text, Link, Hyperlink } from 'app/components/core'
import Skeleton from 'app/components/skeleton'
import { make } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
import { useThemeColors } from 'app/utils/theme'

import { useSelectProfile } from '../selectors'
import { squashNewLines } from '../utils'

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  icon: {
    height: 28,
    width: 28,
    fill: palette.neutral
  },
  iconSkeleton: {
    height: 28,
    width: 28
  },
  linkSkeleton: {
    height: 28,
    width: 150,
    marginLeft: spacing(3)
  },
  withText: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start'
  },
  text: { marginLeft: spacing(2), marginBottom: 0 },
  hyperlinkText: {
    fontSize: typography.fontSize.medium,
    color: palette.neutral
  },
  hyperlinkLink: {
    fontSize: typography.fontSize.medium
  },
  active: {
    color: palette.primary
  }
}))

export type SocialLinkProps = LinkProps &
  Pick<IconButtonProps, 'icon'> & {
    style?: StyleProp<ViewStyle>
    text?: string
    showText?: boolean
    hyperlink?: boolean
  }

export const SocialLink = (props: SocialLinkProps) => {
  const { text, showText, url, icon: Icon, hyperlink, style, ...other } = props
  const styles = useStyles()
  const { primary, neutral } = useThemeColors()
  const [isActive, setIsActive] = useState(false)

  const handlePressIn = useCallback(() => {
    setIsActive(true)
  }, [])

  const handlePressOut = useCallback(() => {
    setIsActive(false)
  }, [])

  // undefined equates to "LOADING" from backend
  if (text === undefined) {
    if (showText) {
      return (
        <View style={[styles.withText, style]}>
          <Skeleton style={styles.iconSkeleton} />
          <Skeleton style={styles.linkSkeleton} />
        </View>
      )
    }
    return (
      <Skeleton
        style={[styles.iconSkeleton, showText && styles.withText, style]}
      />
    )
  }

  if (text === null || text === '') return null

  const iconButtonElement = (
    <Icon height={28} width={28} fill={isActive ? primary : neutral} />
  )

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
          <Hyperlink
            source='profile page'
            text={squashNewLines(text)}
            styles={{
              root: [
                styles.text,
                styles.hyperlinkText,
                isActive && styles.active
              ],
              link: styles.hyperlinkLink
            }}
          />
        ) : (
          <Text
            numberOfLines={1}
            style={[styles.text, isActive && styles.active]}
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
