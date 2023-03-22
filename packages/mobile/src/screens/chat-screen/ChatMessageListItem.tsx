import { forwardRef } from 'react'

import type { ReactionTypes } from '@audius/common'
import {
  accountSelectors,
  decodeHashId,
  formatMessageDate
} from '@audius/common'
import type { ChatMessage, ChatMessageReaction } from '@audius/sdk'
import type { ViewStyle, StyleProp } from 'react-native'
import { View } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'

import ChatTail from 'app/assets/images/ChatTail.svg'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemePalette } from 'app/utils/theme'

import { reactionMap } from '../notifications-screen/Reaction'

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
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    marginTop: spacing(2),
    backgroundColor: palette.white,
    borderRadius: spacing(3),
    shadowColor: 'black',
    shadowOffset: { width: -2, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  isAuthor: {
    backgroundColor: palette.secondary
  },
  message: {
    fontSize: typography.fontSize.medium,
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
  message: ChatMessage
  hasTail: boolean
  shouldShowReaction?: boolean
  shouldShowDate?: boolean
  style?: StyleProp<ViewStyle>
  onLongPress?: () => void
}

export const ChatMessageListItem = forwardRef<View, ChatMessageListItemProps>(
  (props: ChatMessageListItemProps, refProp) => {
    const {
      message,
      hasTail,
      shouldShowReaction = true,
      shouldShowDate = true,
      style: styleProp,
      onLongPress
    } = props
    const styles = useStyles()
    const palette = useThemePalette()

    const userId = useSelector(getUserId)
    const senderUserId = decodeHashId(message.sender_user_id)
    const isAuthor = senderUserId === userId

    return (
      <>
        <View
          style={[
            isAuthor ? styles.rootIsAuthor : styles.rootOtherUser,
            !hasTail && message.reactions.length > 0
              ? styles.reactionMarginBottom
              : null,
            styleProp
          ]}
        >
          <View>
            <TouchableWithoutFeedback onPress={onLongPress}>
              <View>
                <View
                  style={[styles.bubble, isAuthor && styles.isAuthor]}
                  ref={refProp}
                >
                  <Text
                    style={[styles.message, isAuthor && styles.messageIsAuthor]}
                  >
                    {message.message}
                  </Text>
                </View>
                {message.reactions?.length > 0 ? (
                  <>
                    {shouldShowReaction ? (
                      <View
                        style={[
                          styles.reactionContainer,
                          isAuthor
                            ? styles.reactionContainerIsAuthor
                            : styles.reactionContainerOtherUser
                        ]}
                      >
                        {message.reactions.map((reaction, index) => {
                          return (
                            <ChatReaction key={index} reaction={reaction} />
                          )
                        })}
                      </View>
                    ) : null}
                  </>
                ) : null}
              </View>
            </TouchableWithoutFeedback>
          </View>
          {hasTail ? (
            <>
              <View
                style={[
                  styles.tail,
                  isAuthor ? styles.tailIsAuthor : styles.tailOtherUser,
                  !shouldShowDate && { bottom: 0 }
                ]}
              >
                <View style={styles.tailShadow} />
                <ChatTail fill={isAuthor ? palette.secondary : palette.white} />
              </View>
              {shouldShowDate ? (
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
  }
)
