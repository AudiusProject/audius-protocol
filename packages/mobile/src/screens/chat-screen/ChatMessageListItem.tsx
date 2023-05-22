import { memo, useCallback } from 'react'

import type { ReactionTypes, ChatMessageWithExtras } from '@audius/common'
import {
  accountSelectors,
  chatSelectors,
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
const { isIdEqualToReactionsPopupMessageId } = chatSelectors

const TAIL_BOTTOM_OFFSET = -0.4
const TAIL_SIZE = 18

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
  shadow: {
    shadowColor: 'black',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 }
  },
  tail: {
    display: 'flex',
    position: 'absolute',
    bottom: TAIL_BOTTOM_OFFSET
  },
  tailIsAuthor: {
    right: -TAIL_SIZE
  },
  tailOtherUser: {
    left: -TAIL_SIZE,
    transform: [{ scaleX: -1 }]
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
  chatId: string
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
    chatId,
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
  const isUnderneathPopup =
    useSelector((state) =>
      isIdEqualToReactionsPopupMessageId(state, message.message_id)
    ) && !isPopup

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
            <View style={styles.shadow}>
              <View
                style={[styles.bubble, isAuthor && styles.isAuthor]}
                ref={
                  itemsRef
                    ? (el) => (itemsRef.current[message.message_id] = el)
                    : null
                }
              >
                {link ? (
                  <LinkPreview
                    key={`${link.value}-${link.start}-${link.end}`}
                    chatId={chatId}
                    messageId={message.message_id}
                    href={link.href}
                    isLinkPreviewOnly={isLinkPreviewOnly}
                    onLongPress={handleLongPress}
                  />
                ) : null}
                {!isLinkPreviewOnly ? (
                  <Hyperlink
                    text={message.message}
                    styles={{
                      root: [
                        styles.message,
                        isAuthor && styles.messageIsAuthor
                      ],
                      link: [
                        styles.message,
                        styles.link,
                        isAuthor && styles.messageIsAuthor
                      ]
                    }}
                  />
                ) : null}
              </View>
              {message.hasTail ? (
                <ChatTail
                  fill={
                    isAuthor && !isLinkPreviewOnly
                      ? palette.secondary
                      : palette.white
                  }
                  style={[
                    styles.tail,
                    isAuthor ? styles.tailIsAuthor : styles.tailOtherUser
                  ]}
                />
              ) : null}
              {message.reactions?.length > 0 ? (
                <>
                  {!isUnderneathPopup ? (
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
            </View>
          </Pressable>
        </View>
        {message.hasTail ? (
          <>
            {!isPopup ? (
              <View style={styles.dateContainer}>
                <Text style={styles.date}>
                  {isUnderneathPopup
                    ? ' '
                    : formatMessageDate(message.created_at)}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </>
  )
})
