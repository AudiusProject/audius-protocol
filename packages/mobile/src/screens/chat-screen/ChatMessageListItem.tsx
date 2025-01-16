import { memo, useCallback, useState } from 'react'

import { Status } from '@audius/common/models'
import type { ReactionTypes } from '@audius/common/store'
import { accountSelectors, chatSelectors } from '@audius/common/store'
import {
  formatMessageDate,
  isCollectionUrl,
  isTrackUrl
} from '@audius/common/utils'
import { HashId, type ChatMessageReaction } from '@audius/sdk'
import { find } from 'linkifyjs'
import type { ViewStyle, StyleProp } from 'react-native'
import { Dimensions, Keyboard, View } from 'react-native'
import { useSelector } from 'react-redux'

import ChatTail from 'app/assets/images/ChatTail.svg'
import { Pressable, UserGeneratedText, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'
import { zIndex } from 'app/utils/zIndex'

import { reactionMap } from '../notifications-screen/Reaction'

import { ChatMessagePlaylist } from './ChatMessagePlaylist'
import { ChatMessageTrack } from './ChatMessageTrack'
import { LinkPreview } from './LinkPreview'
import { ResendMessageButton } from './ResendMessageButton'
import { REACTION_LONGPRESS_DELAY } from './constants'

const { getUserId } = accountSelectors
const { isIdEqualToReactionsPopupMessageId, getChatMessageById } = chatSelectors

const TAIL_HORIZONTAL_OFFSET = 7

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  rootOtherUser: {
    display: 'flex',
    alignItems: 'flex-start',
    minHeight: spacing(4)
  },
  rootIsAuthor: {
    display: 'flex',
    alignItems: 'flex-end',
    minHeight: spacing(4)
  },
  bubble: {
    marginTop: spacing(2),
    borderRadius: spacing(3),
    overflow: 'hidden'
  },
  pressed: {
    backgroundColor: palette.neutralLight10
  },
  pressedIsAuthor: {
    backgroundColor: palette.secondaryLight1
  },
  messageContainer: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    backgroundColor: palette.white
  },
  messageContainerAuthor: {
    backgroundColor: palette.secondaryLight2
  },
  dateContainer: {
    zIndex: -1,
    marginTop: spacing(2),
    marginBottom: spacing(6)
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: palette.neutralLight2
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
    bottom: 0,
    zIndex: zIndex.CHAT_TAIL
  },
  tailIsAuthor: {
    right: -TAIL_HORIZONTAL_OFFSET
  },
  tailOtherUser: {
    left: -TAIL_HORIZONTAL_OFFSET,
    transform: [{ scaleX: -1 }]
  },
  reaction: {
    height: spacing(16),
    width: spacing(16)
  },
  reactionContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    bottom: spacing(8),
    gap: -spacing(12),
    height: 0
  },
  reactionContainerIsAuthor: {
    right: spacing(8)
  },
  reactionContainerOtherUser: {
    left: spacing(8),
    flexDirection: 'row'
  },
  reactionMarginBottom: {
    marginBottom: spacing(2)
  },
  unfurl: {
    width: Dimensions.get('window').width - 48,
    minHeight: 72,
    borderRadius: 0 // Undoes border radius from track/collection tiles
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
      ? styles.messageContainerAuthor.backgroundColor
      : styles.messageContainer.backgroundColor
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
  messageId: string
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
    messageId,
    chatId,
    isPopup = false,
    style: styleProp,
    onLongPress,
    handleClosePopup,
    itemsRef
  } = props
  const styles = useStyles()
  const userId = useSelector(getUserId)
  const message = useSelector((state) =>
    getChatMessageById(state, chatId, messageId)
  )
  const senderUserId = message ? HashId.parse(message.sender_user_id) : null
  const isAuthor = senderUserId === userId
  const [isPressed, setIsPressed] = useState(false)
  const [emptyUnfurl, setEmptyUnfurl] = useState(false)
  const links = find(message?.message ?? '')
  const link = links.filter((link) => link.type === 'url' && link.isLink)[0]
  const linkValue = link?.value
  const isUnfurlOnly = linkValue === message?.message.trim()
  const hideMessage = isUnfurlOnly && !emptyUnfurl
  const isCollection = isCollectionUrl(linkValue)
  const isTrack = isTrackUrl(linkValue)
  const tailColor = useGetTailColor(isAuthor, isPressed, hideMessage)
  const isUnderneathPopup =
    useSelector((state) =>
      isIdEqualToReactionsPopupMessageId(state, messageId)
    ) && !isPopup

  const handlePressIn = useCallback(() => {
    setIsPressed(true)
  }, [setIsPressed])

  const handlePressOut = useCallback(() => {
    setIsPressed(false)
  }, [setIsPressed])

  const handleLongPress = useCallback(() => {
    if (message?.status !== Status.ERROR) {
      onLongPress?.(messageId)
    }
  }, [message?.status, messageId, onLongPress])

  const onUnfurlEmpty = useCallback(() => {
    if (linkValue) {
      setEmptyUnfurl(true)
    }
  }, [linkValue])

  const onUnfurlSuccess = useCallback(() => {
    if (linkValue) {
      setEmptyUnfurl(false)
    }
  }, [linkValue])

  const { secondaryDark1, neutralLight7 } = useThemeColors()

  const borderBottomColor = isAuthor ? secondaryDark1 : neutralLight7
  const borderBottomWidth = hideMessage || isCollection || isTrack ? 0 : 1
  const unfurlStyles = {
    ...styles.unfurl,
    borderBottomColor,
    borderBottomWidth
  }

  return message ? (
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
            style={{ opacity: isUnderneathPopup ? 0 : 1 }}
          >
            <View style={styles.shadow}>
              <View style={styles.shadow2}>
                <View
                  style={[
                    styles.bubble,
                    isPressed
                      ? isAuthor
                        ? styles.pressedIsAuthor
                        : styles.pressed
                      : null
                  ]}
                  ref={
                    itemsRef ? (el) => (itemsRef.current[messageId] = el) : null
                  }
                >
                  {isCollection ? (
                    <ChatMessagePlaylist
                      key={`${link.value}-${link.start}-${link.end}`}
                      link={link.value}
                      onEmpty={onUnfurlEmpty}
                      onSuccess={onUnfurlSuccess}
                      styles={unfurlStyles}
                    />
                  ) : isTrack ? (
                    <ChatMessageTrack
                      key={`${link.value}-${link.start}-${link.end}`}
                      link={link.value}
                      onEmpty={onUnfurlEmpty}
                      onSuccess={onUnfurlSuccess}
                      styles={unfurlStyles}
                    />
                  ) : link ? (
                    <LinkPreview
                      key={`${link.value}-${link.start}-${link.end}`}
                      chatId={chatId}
                      messageId={messageId}
                      href={link.href}
                      onLongPress={handleLongPress}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      isPressed={isPressed}
                      onEmpty={onUnfurlEmpty}
                      onSuccess={onUnfurlSuccess}
                      style={unfurlStyles}
                    />
                  ) : null}
                  {!hideMessage ? (
                    <View
                      style={[
                        styles.messageContainer,
                        isAuthor && styles.messageContainerAuthor
                      ]}
                    >
                      <UserGeneratedText
                        variant='body'
                        lineHeight='multi'
                        color={isAuthor ? 'staticWhite' : 'default'}
                        textAlign='left'
                        linkProps={{
                          variant: isAuthor ? 'inverted' : 'visible',
                          showUnderline: true
                        }}
                        onPress={Keyboard.dismiss}
                        onLongPress={handleLongPress}
                      >
                        {message.message}
                      </UserGeneratedText>
                    </View>
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
                        {message?.reactions.map((reaction) => {
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
          <ResendMessageButton messageId={messageId} chatId={chatId} />
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
  ) : null
})
