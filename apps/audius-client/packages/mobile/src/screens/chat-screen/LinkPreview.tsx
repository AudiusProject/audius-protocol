import { useLinkUnfurlMetadata } from '@audius/common'
import type { GestureResponderEvent } from 'react-native'
import { View, Image } from 'react-native'

import { Text, Link } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { REACTION_LONGPRESS_DELAY } from './constants'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    backgroundColor: palette.white,
    borderTopLeftRadius: spacing(3),
    borderTopRightRadius: spacing(3),
    overflow: 'hidden'
  },
  rootIsLinkPreviewOnly: {
    borderRadius: spacing(3)
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
    height: '100%'
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
  isLinkPreviewOnly: boolean
  isPressed: boolean
  onLongPress: (event: GestureResponderEvent) => void
  onPressIn: (event: GestureResponderEvent) => void
  onPressOut: (event: GestureResponderEvent) => void
}

export const LinkPreview = ({
  chatId,
  messageId,
  href,
  isLinkPreviewOnly,
  isPressed = false,
  onLongPress,
  onPressIn,
  onPressOut
}: LinkPreviewProps) => {
  const styles = useStyles()
  const metadata = useLinkUnfurlMetadata(chatId, messageId, href)
  const domain = metadata?.url ? new URL(metadata.url).hostname : ''

  if (!metadata) {
    return null
  }

  return (
    <Link
      url={href}
      delayLongPress={REACTION_LONGPRESS_DELAY}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <View
        style={[
          styles.root,
          isPressed ? styles.pressed : null,
          isLinkPreviewOnly ? styles.rootIsLinkPreviewOnly : null
        ]}
      >
        {metadata.description || metadata.title ? (
          <>
            {metadata.image ? (
              <View style={styles.thumbnail}>
                <Image
                  source={{ uri: metadata.image }}
                  style={styles.image}
                  alt={metadata.site_name}
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
              {metadata.title ? (
                <Text style={styles.title}>{metadata.title}</Text>
              ) : null}
              {metadata.description ? (
                <Text numberOfLines={1} style={styles.description}>
                  {metadata.description}
                </Text>
              ) : (
                <View style={styles.noDescriptionMarginBottom} />
              )}
            </View>
          </>
        ) : metadata.image ? (
          <View>
            <Image
              style={styles.image}
              source={{ uri: metadata.image }}
              alt={metadata.site_name}
            />
          </View>
        ) : null}
      </View>
    </Link>
  )
}
