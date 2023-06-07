import { useCallback } from 'react'

import type {
  ChatMessageWithExtras,
  Nullable,
  ReactionTypes
} from '@audius/common'
import { chatActions, encodeHashId, accountSelectors } from '@audius/common'
import Clipboard from '@react-native-clipboard/clipboard'
import { Dimensions, Pressable, Animated } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { usePopupAnimation } from 'app/hooks/usePopupAnimation'
import { useToast } from 'app/hooks/useToast'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { zIndex } from 'app/utils/zIndex'

import { ReactionList } from '../notifications-screen/Reaction'

import { ChatMessageListItem } from './ChatMessageListItem'
import { CopyMessagesButton } from './CopyMessagesButton'
import {
  REACTION_CONTAINER_HEIGHT,
  REACTION_CONTAINER_TOP_OFFSET
} from './constants'

const { getUserId } = accountSelectors
const { setMessageReaction } = chatActions

const messages = {
  messageCopied: 'Message copied to clipboard'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  dimBackground: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: zIndex.CHAT_REACTIONS_POPUP_DIM_BACKGROUND,
    backgroundColor: 'black'
  },
  popupContainer: {
    position: 'absolute',
    display: 'flex',
    zIndex: zIndex.CHAT_REACTIONS_POPUP_CLOSE_PRESSABLES,
    overflow: 'hidden'
  },
  outerPressable: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: zIndex.CHAT_REACTIONS_POPUP_CLOSE_PRESSABLES
  },
  innerPressable: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: zIndex.CHAT_REACTIONS_POPUP_CLOSE_PRESSABLES
  },
  reactionsContainer: {
    borderWidth: 1,
    borderRadius: spacing(12),
    borderColor: palette.neutralLight9,
    zIndex: zIndex.CHAT_REACTIONS_POPUP_CONTENT,
    width: Dimensions.get('window').width - spacing(10),
    backgroundColor: palette.white,
    marginHorizontal: spacing(5)
  },
  popupChatMessage: {
    position: 'absolute',
    maxWidth: Dimensions.get('window').width - spacing(12),
    zIndex: zIndex.CHAT_REACTIONS_POPUP_CONTENT
  },
  emoji: {
    height: spacing(17)
  },
  copyPressableContainer: {
    position: 'absolute',
    dipslay: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    zIndex: zIndex.CHAT_REACTIONS_POPUP_CONTENT
  },
  copyAnimatedContainer: {
    dipslay: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    zIndex: zIndex.CHAT_REACTIONS_POPUP_CONTENT
  },
  copyText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontByWeight.bold,
    color: palette.white
  }
}))

type ReactionPopupProps = {
  chatId: string
  messageTop: number
  messageHeight: number
  containerTop: number
  containerBottom: number
  isAuthor: boolean
  message: ChatMessageWithExtras
  shouldShowPopup: boolean
  onClose: () => void
}

export const ReactionPopup = ({
  chatId,
  messageTop,
  messageHeight,
  containerTop,
  containerBottom,
  isAuthor,
  message,
  shouldShowPopup,
  onClose
}: ReactionPopupProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const userId = useSelector(getUserId)
  const { toast } = useToast()

  const userIdEncoded = encodeHashId(userId)
  const selectedReaction = message.reactions?.find(
    (r) => r.user_id === userIdEncoded
  )?.reaction

  const [
    backgroundOpacityAnim,
    otherOpacityAnim,
    translationAnim,
    handleClosePopup
  ] = usePopupAnimation(onClose)

  const handleReactionSelected = useCallback(
    (message: Nullable<ChatMessageWithExtras>, reaction: ReactionTypes) => {
      if (userId && message) {
        dispatch(
          setMessageReaction({
            userId,
            chatId,
            messageId: message.message_id,
            reaction:
              message.reactions?.find((r) => r.user_id === userIdEncoded)
                ?.reaction === reaction
                ? null
                : reaction
          })
        )
      }
      handleClosePopup()
    },
    [userId, handleClosePopup, dispatch, chatId, userIdEncoded]
  )

  const handleCopyPress = useCallback(() => {
    Clipboard.setString(message.message)
    handleClosePopup()
    toast({ content: messages.messageCopied, type: 'info' })
  }, [message.message, handleClosePopup, toast])

  const handleReactionChanged = useCallback(
    (reaction) => {
      if (reaction) {
        handleReactionSelected(message, reaction)
      }
    },
    [message, handleReactionSelected]
  )

  if (!shouldShowPopup) {
    return null
  }

  return (
    <>
      <Animated.View
        style={[styles.dimBackground, { opacity: backgroundOpacityAnim }]}
      />
      <Pressable style={styles.outerPressable} onPress={handleClosePopup} />
      {/* This View cuts off the message body when it goes beyond the
      bottom boundary of the flatlist view. */}
      <Animated.View
        style={[
          styles.popupContainer,
          {
            height: containerBottom - containerTop,
            top: containerTop
          },
          { opacity: otherOpacityAnim }
        ]}
      >
        {/* This 2nd pressable ensures that clicking outside of the
        message and reaction list, but inside of flatlist view,
        closes the popup. */}
        <Pressable style={styles.innerPressable} onPress={handleClosePopup} />
        <ChatMessageListItem
          chatId={chatId}
          message={message}
          isPopup={true}
          style={[
            styles.popupChatMessage,
            {
              top: messageTop - containerTop,
              right: isAuthor ? spacing(6) : undefined,
              left: !isAuthor ? spacing(6) : undefined
            }
          ]}
          handleClosePopup={handleClosePopup}
        />
        <CopyMessagesButton
          isAuthor={isAuthor}
          messageTop={messageTop}
          containerTop={containerTop}
          messageHeight={messageHeight}
          onPress={handleCopyPress}
        />
        <Animated.View
          style={[
            styles.reactionsContainer,
            {
              top: Math.max(
                messageTop - containerTop - REACTION_CONTAINER_HEIGHT,
                containerTop -
                  REACTION_CONTAINER_HEIGHT -
                  REACTION_CONTAINER_TOP_OFFSET
              ),
              transform: [
                {
                  translateY: translationAnim
                }
              ]
            }
          ]}
        >
          <ReactionList
            selectedReaction={selectedReaction as ReactionTypes}
            onChange={handleReactionChanged}
            isVisible={shouldShowPopup}
            scale={1.6}
            style={{
              emoji: styles.emoji
            }}
          />
        </Animated.View>
      </Animated.View>
    </>
  )
}
