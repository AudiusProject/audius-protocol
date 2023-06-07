import { memo, useCallback, useState } from 'react'

import type { ReactionTypes, ChatMessageWithExtras } from '@audius/common'
import {
  Status,
  accountSelectors,
  chatSelectors,
  decodeHashId,
  formatMessageDate,
  isPlaylistUrl,
  isTrackUrl
} from '@audius/common'
import type { ChatMessageReaction } from '@audius/sdk'
import { find } from 'linkifyjs'
import type { ViewStyle, StyleProp } from 'react-native'
import { Dimensions, View } from 'react-native'
import { useSelector } from 'react-redux'

import ChatTail from 'app/assets/images/ChatTail.svg'
import { Pressable, Hyperlink, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { reactionMap } from '../notifications-screen/Reaction'

import { ChatMessagePlaylist } from './ChatMessagePlaylist'
import { ChatMessageTrack } from './ChatMessageTrack'
import { LinkPreview } from './LinkPreview'
import { ResendMessageButton } from './ResendMessageButton'
import { REACTION_LONGPRESS_DELAY } from './constants'

const { getUserId } = accountSelectors
const { isIdEqualToReactionsPopupMessageId } = chatSelectors

const TAIL_HORIZONTAL_OFFSET = 7

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
    backgroundColor: palette.secondaryLight2
  },
  pressed: {
    backgroundColor: palette.neutralLight10
  },
  pressedIsAuthor: {
    backgroundColor: palette.secondaryLight1
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
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  shadow2: {
    shadowColor: 'black',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 }
  },
  tail: {
    display: 'flex',
    position: 'absolute',
    bottom: 0
  },
  tailIsAuthor: {
    right: -TAIL_HORIZONTAL_OFFSET
  },
  tailOtherUser: {
    left: -TAIL_HORIZONTAL_OFFSET,
    transform: [{ scaleX: -1 }]
  },
  reaction: {
    height: spacing(8),
    width: spacing(8)
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
  },
  unfurl: {
    width: Dimensions.get('window').width - 48,
    minHeight: 72,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  },
  unfurlAuthor: {
    borderBottomColor: palette.secondaryDark1
  },
  unfurlOtherUser: {
    borderBottomColor: palette.neutralLight7
  }
}))

const useGetTailColor = (
  isAuthor: boolean,
  isPressed: boolean,
  hideMessage: boolean
) => {
  const styles = useStyles()
  return isPressed
    ? isAuthor && !hideMessage
      ? styles.pressedIsAuthor.backgroundColor
      : styles.pressed.backgroundColor
    : isAuthor && !hideMessage
    ? styles.isAuthor.backgroundColor
    : styles.bubble.backgroundColor
}

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
  handleClosePopup?: () => void
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
    handleClosePopup,
    itemsRef
  } = props
  const styles = useStyles()
  const userId = useSelector(getUserId)
  const senderUserId = decodeHashId(message.sender_user_id)
  const isAuthor = senderUserId === userId
  const [isPressed, setIsPressed] = useState(false)
  const [emptyLinkPreview, setEmptyLinkPreview] = useState(false)
  const links = find(message.message)
  const link = links.filter((link) => link.type === 'url' && link.isLink)[0]
  const linkValue = link?.value
  const isLinkPreviewOnly = linkValue === message.message
  const hideMessage = isLinkPreviewOnly && !emptyLinkPreview
  const tailColor = useGetTailColor(isAuthor, isPressed, hideMessage)
  const isUnderneathPopup =
    useSelector((state) =>
      isIdEqualToReactionsPopupMessageId(state, message.message_id)
    ) && !isPopup

  const handlePressIn = useCallback(() => {
    setIsPressed(true)
  }, [setIsPressed])

  const handlePressOut = useCallback(() => {
    setIsPressed(false)
  }, [setIsPressed])

  const handleLongPress = useCallback(() => {
    if (message.status !== Status.ERROR) {
      onLongPress?.(message.message_id)
    }
  }, [message.message_id, message.status, onLongPress])

  const onLinkPreviewEmpty = useCallback(() => {
    if (linkValue) {
      setEmptyLinkPreview(true)
    }
  }, [linkValue])

  const onLinkPreviewSuccess = useCallback(() => {
    if (linkValue) {
      setEmptyLinkPreview(false)
    }
  }, [linkValue])

  const chatStyles = !hideMessage
    ? isAuthor
      ? { ...styles.unfurl, ...styles.unfurlAuthor }
      : { ...styles.unfurl, ...styles.unfurlOtherUser }
    : styles.unfurl

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
            onPressIn={isPopup ? handleClosePopup : handlePressIn}
            onPressOut={isPopup ? handleClosePopup : handlePressOut}
          >
            <View style={styles.shadow}>
              <View style={styles.shadow2}>
                <View
                  style={[
                    styles.bubble,
                    isAuthor ? styles.isAuthor : null,
                    isPressed
                      ? isAuthor
                        ? styles.pressedIsAuthor
                        : styles.pressed
                      : null
                  ]}
                  ref={
                    itemsRef
                      ? (el) => (itemsRef.current[message.message_id] = el)
                      : null
                  }
                >
                  {isPlaylistUrl(linkValue) ? (
                    <ChatMessagePlaylist
                      key={`${link.value}-${link.start}-${link.end}`}
                      link={link.value}
                      onEmpty={onLinkPreviewEmpty}
                      onSuccess={onLinkPreviewSuccess}
                      styles={chatStyles}
                    />
                  ) : isTrackUrl(linkValue) ? (
                    <ChatMessageTrack
                      key={`${link.value}-${link.start}-${link.end}`}
                      link={link.value}
                      onEmpty={onLinkPreviewEmpty}
                      onSuccess={onLinkPreviewSuccess}
                      styles={chatStyles}
                    />
                  ) : link ? (
                    <LinkPreview
                      key={`${link.value}-${link.start}-${link.end}`}
                      chatId={chatId}
                      messageId={message.message_id}
                      href={link.href}
                      hideMessage={hideMessage}
                      onLongPress={handleLongPress}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      isPressed={isPressed}
                      onEmpty={onLinkPreviewEmpty}
                      onSuccess={onLinkPreviewSuccess}
                      style={{ ...chatStyles, borderBottomWidth: 1 }}
                    />
                  ) : null}
                  {!hideMessage ? (
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
                    fill={tailColor}
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
            </View>
          </Pressable>
        </View>
        {isAuthor && message.status === Status.ERROR ? (
          <ResendMessageButton messageId={message.message_id} chatId={chatId} />
        ) : null}
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
