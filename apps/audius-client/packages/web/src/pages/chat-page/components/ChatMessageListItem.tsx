import { useCallback, useRef, useState } from 'react'

import {
  accountSelectors,
  cacheUsersSelectors,
  chatActions,
  decodeHashId,
  ReactionTypes,
  useProxySelector
} from '@audius/common'
import type { ChatMessage } from '@audius/sdk'
import { IconPlus, PopupPosition } from '@audius/stems'
import cn from 'classnames'
import dayjs from 'dayjs'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { reactionMap } from 'components/notification/Notification/components/Reaction'

import { ReactComponent as ChatTail } from '../../../assets/img/ChatTail.svg'

import styles from './ChatMessageListItem.module.css'
import { ReactionPopupMenu } from './ReactionPopupMenu'

const { setMessageReaction } = chatActions
const { getUserId } = accountSelectors

type ChatMessageListItemProps = {
  chatId: string
  message: ChatMessage
  hasTail: boolean
}

export const formatMessageDate = (date: string) => {
  const d = dayjs(date)
  const today = dayjs()
  if (d.isBefore(today, 'week')) return d.format('M/D/YY h:mm A')
  if (d.isBefore(today, 'day')) return d.format('dddd h:mm A')
  return d.format('h:mm A')
}

export const ChatMessageListItem = (props: ChatMessageListItemProps) => {
  const { chatId, message, hasTail } = props
  const reactionButtonRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const [isReactionPopupVisible, setReactionPopupVisible] = useState(false)
  const senderUserId = decodeHashId(message.sender_user_id)
  const userId = useSelector(getUserId)
  const isAuthor = userId === senderUserId
  const reactionUsers = useProxySelector(
    (state) =>
      cacheUsersSelectors.getUsers(state, {
        ids: message.reactions?.map((r) => decodeHashId(r.user_id)!)
      }),
    [message]
  )

  const handleOpenReactionPopupButtonClicked = useCallback(
    () => setReactionPopupVisible((isVisible) => !isVisible),
    [setReactionPopupVisible]
  )
  const handleCloseReactionPopup = useCallback(
    () => setReactionPopupVisible(false),
    [setReactionPopupVisible]
  )
  const handleReactionSelected = useCallback(
    (reaction: ReactionTypes) => {
      if (userId) {
        dispatch(
          setMessageReaction({
            userId,
            chatId,
            messageId: message.message_id,
            reaction
          })
        )
      }
      handleCloseReactionPopup()
    },
    [dispatch, handleCloseReactionPopup, userId, chatId, message]
  )

  return (
    <div
      className={cn(styles.root, {
        [styles.isAuthor]: isAuthor
      })}
    >
      <div className={styles.bubble}>
        <div className={styles.text}>{message.message}</div>
        <div
          ref={reactionButtonRef}
          className={cn(styles.reactionsButton, {
            [styles.isOpened]: isReactionPopupVisible,
            [styles.hasReaction]:
              message.reactions && message.reactions.length > 0
          })}
          onClick={handleOpenReactionPopupButtonClicked}
        >
          {message.reactions?.length > 0 ? (
            message.reactions.map((reaction) => {
              if (!(reaction.reaction in reactionMap)) {
                console.error(
                  `Reaction type '${reaction.reaction}' does not exist`
                )
                return null
              }
              const Reaction = reactionMap[reaction.reaction as ReactionTypes]
              return (
                <Reaction
                  className={styles.reactionEmoji}
                  key={reaction.user_id}
                  width={48}
                  height={48}
                  title={reactionUsers[decodeHashId(reaction.user_id)!].name}
                />
              )
            })
          ) : (
            <IconPlus className={styles.addReactionIcon} />
          )}
        </div>
        {hasTail ? (
          <div className={styles.tail}>
            <ChatTail />
          </div>
        ) : null}
      </div>
      <ReactionPopupMenu
        anchorRef={reactionButtonRef}
        isVisible={isReactionPopupVisible}
        onClose={handleCloseReactionPopup}
        position={
          isAuthor ? PopupPosition.BOTTOM_RIGHT : PopupPosition.BOTTOM_LEFT
        }
        onSelected={handleReactionSelected}
      />
      {hasTail ? (
        <div className={styles.date}>
          {formatMessageDate(message.created_at)}
        </div>
      ) : null}
    </div>
  )
}
