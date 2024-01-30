import { useCallback, useEffect } from 'react'

import {
  isAllowedExternalLink,
  isAudiusUrl,
  useLeavingAudiusModal
} from '@audius/common'
import { useLinkUnfurlMetadata } from '@audius/common/hooks'
import type { GestureResponderEvent, ViewStyle } from 'react-native'
import { View, Image, Pressable } from 'react-native'

import { Text, useLink } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { REACTION_LONGPRESS_DELAY } from './constants'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    backgroundColor: palette.white
  },
  pressed: {
    backgroundColor: palette.neutralLight10
  },
  thumbnail: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxHeight: spacing(50)
  },
  image: {
    display: 'flex',
    flexGrow: 1,
    width: '100%',
    minWidth: spacing(12),
    minHeight: spacing(50)
  },
  domainContainer: {
    borderBottomColor: palette.neutralLight7,
    borderBottomWidth: 1,
    backgroundColor: palette.white
  },
  domain: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(1),
    fontSize: typography.fontSize.small,
    lineHeight: typography.fontSize.small * 1.5,
    color: palette.neutral
  },
  textContainer: {
    display: 'flex',
    marginTop: spacing(4),
    marginHorizontal: spacing(4),
    backgroundColor: palette.white
  },
  title: {
    fontSize: typography.fontSize.medium,
    lineHeight: typography.fontSize.medium * 1.5,
    fontFamily: typography.fontByWeight.bold
  },
  description: {
    fontSize: typography.fontSize.medium,
    lineHeight: typography.fontSize.medium * 1.5,
    marginBottom: spacing(4)
  },
  noDescriptionMarginBottom: {
    marginBottom: spacing(4)
  }
}))

type LinkPreviewProps = {
  chatId: string
  messageId: string
  href: string
  isPressed: boolean
  onLongPress: (event: GestureResponderEvent) => void
  onPressIn: (event: GestureResponderEvent) => void
  onPressOut: (event: GestureResponderEvent) => void
  onEmpty?: () => void
  onSuccess?: () => void
  style?: ViewStyle
}

export const LinkPreview = ({
  chatId,
  messageId,
  href,
  isPressed = false,
  onLongPress,
  onPressIn,
  onPressOut,
  onEmpty,
  onSuccess,
  style
}: LinkPreviewProps) => {
  const styles = useStyles()
  const metadata = useLinkUnfurlMetadata(chatId, messageId, href)
  const { description, title, site_name: siteName, image } = metadata || {}
  const willRender = !!(description || title || image)
  const domain = metadata?.url ? new URL(metadata.url).hostname : ''
  const { onPress: goToURL } = useLink(href)
  const { onOpen: openLeavingAudiusModal } = useLeavingAudiusModal()

  const handlePress = useCallback(() => {
    if (isAudiusUrl(href) || isAllowedExternalLink(href)) {
      goToURL()
    } else {
      openLeavingAudiusModal({ link: href })
    }
  }, [href, goToURL, openLeavingAudiusModal])

  useEffect(() => {
    if (willRender) {
      onSuccess?.()
    } else {
      onEmpty?.()
    }
  }, [willRender, onSuccess, onEmpty])

  return willRender ? (
    <Pressable
      onPress={handlePress}
      delayLongPress={REACTION_LONGPRESS_DELAY}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <View style={[styles.root, isPressed ? styles.pressed : null, style]}>
        {description || title ? (
          <>
            {image ? (
              <View style={styles.thumbnail}>
                <Image
                  source={{ uri: image }}
                  style={styles.image}
                  alt={siteName}
                />
              </View>
            ) : null}
            <View
              style={[
                styles.domainContainer,
                isPressed ? styles.pressed : null
              ]}
            >
              <Text style={styles.domain}>{domain}</Text>
            </View>
            <View
              style={[styles.textContainer, isPressed ? styles.pressed : null]}
            >
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {description ? (
                <Text numberOfLines={1} style={styles.description}>
                  {description}
                </Text>
              ) : (
                <View style={styles.noDescriptionMarginBottom} />
              )}
            </View>
          </>
        ) : image ? (
          <View>
            <Image
              style={styles.image}
              source={{ uri: image }}
              alt={siteName}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  ) : null
}
