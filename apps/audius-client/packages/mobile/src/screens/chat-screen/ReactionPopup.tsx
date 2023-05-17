import { useCallback } from 'react'

import type {
  ChatMessageWithExtras,
  Nullable,
  ReactionTypes
} from '@audius/common'
import { chatActions, encodeHashId, accountSelectors } from '@audius/common'
import { View, Dimensions, Pressable, Animated } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { usePopupAnimation } from 'app/hooks/usePopupAnimation'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import { ReactionList } from '../notifications-screen/Reaction'

import { ChatMessageListItem } from './ChatMessageListItem'
import {
  REACTION_CONTAINER_HEIGHT,
  REACTION_CONTAINER_TOP_OFFSET
} from './constants'

const { getUserId } = accountSelectors
const { setMessageReaction } = chatActions

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  reactionsContainer: {
    borderWidth: 1,
    borderRadius: spacing(12),
    borderColor: palette.neutralLight9,
    zIndex: 40,
    width: Dimensions.get('window').width - spacing(10),
    backgroundColor: palette.white,
    marginHorizontal: spacing(5)
  },
  popupContainer: {
    position: 'absolute',
    display: 'flex',
    zIndex: 20,
    overflow: 'hidden'
  },
  dimBackground: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: 10,
    backgroundColor: 'black'
  },
  outerPressable: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: 20
  },
  innerPressable: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: 30
  },
  popupChatMessage: {
    position: 'absolute',
    maxWidth: Dimensions.get('window').width - spacing(12),
    zIndex: 40
  },
  emoji: {
    height: spacing(17)
  }
}))

type ReactionPopupProps = {
  chatId: string
  messageTop: number
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

  return shouldShowPopup ? (
    <>
      <Animated.View
        style={[
          styles.dimBackground,
          { opacity: backgroundOpacityAnim.current }
        ]}
      />
      <Pressable style={styles.outerPressable} onPress={handleClosePopup} />
      {/* This View cuts off the message body when it goes beyond the
      bottom boundary of the flatlist view. */}
      <View
        style={[
          styles.popupContainer,
          {
            height: containerBottom - containerTop,
            top: containerTop
          }
        ]}
      >
        {/* This 2nd pressable ensures that clicking outside of the
        message and reaction list, but inside of flatlist view,
        closes the popup. */}
        <Pressable style={[styles.innerPressable]} onPress={handleClosePopup} />
        <Animated.View style={{ opacity: otherOpacityAnim.current }}>
          <ChatMessageListItem
            chatId={chatId}
            message={message}
            isPopup={true}
            style={[
              styles.popupChatMessage,
              {
                top: messageTop - containerTop,
                alignSelf: isAuthor ? 'flex-end' : 'flex-start',
                right: isAuthor ? spacing(6) : undefined,
                left: !isAuthor ? spacing(6) : undefined
              }
            ]}
          />
        </Animated.View>
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
              opacity: otherOpacityAnim.current,
              transform: [
                {
                  translateY: translationAnim.current
                }
              ]
            }
          ]}
        >
          <ReactionList
            selectedReaction={selectedReaction as ReactionTypes}
            onChange={(reaction) => {
              if (reaction) {
                handleReactionSelected(message, reaction)
              }
            }}
            isVisible={shouldShowPopup}
            scale={1.6}
            style={{
              emoji: styles.emoji
            }}
          />
        </Animated.View>
      </View>
    </>
  ) : null
}
