import { memo, useCallback } from 'react'

import type { ReactionTypes, ChatMessageWithExtras } from '@audius/common'
import {
  accountSelectors,
  decodeHashId,
  formatMessageDate
} from '@audius/common'
import type { ChatMessageReaction } from '@audius/sdk'
import { find } from 'linkifyjs'
import type { ViewStyle, StyleProp } from 'react-native'
import { Pressable, View } from 'react-native'
import { useSelector } from 'react-redux'

import ChatTail from 'app/assets/images/ChatTail.svg'
import { Hyperlink, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemePalette } from 'app/utils/theme'

import { reactionMap } from '../notifications-screen/Reaction'

import { LinkPreview } from './LinkPreview'
import { REACTION_LONGPRESS_DELAY } from './constants'

const { getUserId } = accountSelectors

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  rootOtherUser: {
    display: 'flex',
    alignItems: 'flex-start'
  },
  rootIsAuthor: {
    display: 'flex',
    alignItems: 'flex-end'
  },
  bubble: {
    marginTop: spacing(2),
    backgroundColor: palette.white,
    shadowColor: 'black',
    shadowOffset: { width: -2, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderRadius: spacing(3)
  },
  isAuthor: {
    backgroundColor: palette.secondary
  },
  message: {
    marginHorizontal: spacing(4),
    marginTop: spacing(3),
    marginBottom: spacing(3),
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.medium,
    lineHeight: spacing(6),
    color: palette.neutral
  },
  messageIsAuthor: {
    color: palette.white
  },
  dateContainer: {
    marginTop: spacing(2),
    marginBottom: spacing(6)
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: palette.neutralLight2
  },
  link: {
    textDecorationLine: 'underline'
  },
  tail: {
    display: 'flex',
    position: 'absolute',
    bottom: 47
  },
  tailIsAuthor: {
    right: -spacing(3)
  },
  tailOtherUser: {
    left: -spacing(3),
    transform: [{ scaleX: -1 }]
  },
  tailShadow: {
    position: 'absolute',
    bottom: 0,
    left: spacing(3),
    backgroundColor: palette.background,
    height: 0.2,
    width: spacing(3),
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 2
  },
  reaction: {
    height: spacing(8),
    width: spacing(8),
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  reactionContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    bottom: spacing(4),
    gap: -spacing(4),
    height: 0
  },
  reactionContainerIsAuthor: {
    right: spacing(4)
  },
  reactionContainerOtherUser: {
    left: spacing(4),
    flexDirection: 'row'
  },
  reactionMarginBottom: {
    marginBottom: spacing(2)
  }
}))

type ChatReactionProps = {
  reaction: ChatMessageReaction
}

const ChatReaction = ({ reaction }: ChatReactionProps) => {
  const styles = useStyles()

  if (!reaction || !reaction.reaction || !(reaction.reaction in reactionMap)) {
    return null
  }
  const Reaction = reactionMap[reaction.reaction as ReactionTypes]
  return <Reaction style={styles.reaction} key={reaction.user_id} isVisible />
}

type ChatMessageListItemProps = {
  message: ChatMessageWithExtras
  isPopup: boolean
  style?: StyleProp<ViewStyle>
  onLongPress?: (id: string) => void
  itemsRef?: any
}

export const ChatMessageListItem = memo(function ChatMessageListItem(
  props: ChatMessageListItemProps
) {
  const {
    message,
    isPopup = false,
    style: styleProp,
    onLongPress,
    itemsRef
  } = props
  const styles = useStyles()
  const palette = useThemePalette()

  const userId = useSelector(getUserId)
  const senderUserId = decodeHashId(message.sender_user_id)
  const isAuthor = senderUserId === userId

  const handleLongPress = useCallback(() => {
    onLongPress?.(message.message_id)
  }, [message.message_id, onLongPress])

  const links = find(message.message)
  const link = links.filter((link) => link.type === 'url' && link.isLink)[0]
  const isLinkPreviewOnly = link && link.value === message.message

  return (
    <>
      <View
        style={[
          isAuthor ? styles.rootIsAuthor : styles.rootOtherUser,
          !message.hasTail && message.reactions && message.reactions.length > 0
            ? styles.reactionMarginBottom
            : null,
          styleProp
        ]}
      >
        <View>
          <Pressable
            onLongPress={handleLongPress}
            delayLongPress={REACTION_LONGPRESS_DELAY}
          >
            <View
              style={[styles.bubble, isAuthor && styles.isAuthor]}
              ref={
                itemsRef
                  ? (el) => (itemsRef.current[message.message_id] = el)
                  : null
              }
            >
              <View>
                {link ? (
                  <LinkPreview
                    key={`${link.value}-${link.start}-${link.end}`}
                    href={link.href}
                    isLinkPreviewOnly={isLinkPreviewOnly}
                    onLongPress={handleLongPress}
                  />
                ) : null}
              </View>
              {!isLinkPreviewOnly ? (
                <Hyperlink
                  text={message.message}
                  styles={{
                    root: [styles.message, isAuthor && styles.messageIsAuthor],
                    link: [
                      styles.message,
                      styles.link,
                      isAuthor && styles.messageIsAuthor
                    ]
                  }}
                />
              ) : null}
            </View>
            {message.reactions?.length > 0 ? (
              <>
                {!isPopup ? (
                  <View
                    style={[
                      styles.reactionContainer,
                      isAuthor
                        ? styles.reactionContainerIsAuthor
                        : styles.reactionContainerOtherUser
                    ]}
                  >
                    {message.reactions.map((reaction) => {
                      return (
                        <ChatReaction
                          key={reaction.created_at}
                          reaction={reaction}
                        />
                      )
                    })}
                  </View>
                ) : null}
              </>
            ) : null}
          </Pressable>
        </View>
        {message.hasTail ? (
          <>
            <View
              style={[
                styles.tail,
                isAuthor ? styles.tailIsAuthor : styles.tailOtherUser,
                isPopup && { bottom: 0 }
              ]}
            >
              <View style={styles.tailShadow} />
              <ChatTail
                fill={
                  isAuthor && !isLinkPreviewOnly
                    ? palette.secondary
                    : palette.white
                }
              />
            </View>
            {!isPopup ? (
              <View style={styles.dateContainer}>
                <Text style={styles.date}>
                  {formatMessageDate(message.created_at)}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </>
  )
})
