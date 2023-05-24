import { useCallback, useRef, useState } from 'react'

import {
  accountSelectors,
  cacheUsersSelectors,
  chatActions,
  decodeHashId,
  encodeHashId,
  ReactionTypes,
  useProxySelector,
  formatMessageDate,
  isAudiusUrl,
  getPathFromAudiusUrl,
  useCanSendMessage
} from '@audius/common'
import type { ChatMessage } from '@audius/sdk'
import { IconPlus, PopupPosition } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import Linkify from 'linkify-react'
import { find } from 'linkifyjs'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { reactionMap } from 'components/notification/Notification/components/Reaction'

import { ReactComponent as ChatTail } from '../../../assets/img/ChatTail.svg'

import styles from './ChatMessageListItem.module.css'
import { LinkPreview } from './LinkPreview'
import { ReactionPopupMenu } from './ReactionPopupMenu'

const { setMessageReaction } = chatActions
const { getUserId } = accountSelectors

type ChatMessageListItemProps = {
  chatId: string
  message: ChatMessage
  hasTail: boolean
}

export const ChatMessageListItem = (props: ChatMessageListItemProps) => {
  const { chatId, message, hasTail } = props

  // Refs
  const reactionButtonRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()

  // State
  const [isReactionPopupVisible, setReactionPopupVisible] = useState(false)

  // Selectors
  const userId = useSelector(getUserId)
  const reactionUsers = useProxySelector(
    (state) =>
      cacheUsersSelectors.getUsers(state, {
        ids: message.reactions?.map((r) => decodeHashId(r.user_id)!)
      }),
    [message]
  )

  // Derived
  const senderUserId = decodeHashId(message.sender_user_id)
  const isAuthor = userId === senderUserId
  const links = find(message.message)

  // Callbacks
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
            reaction:
              message.reactions?.find((r) => r.user_id === encodeHashId(userId))
                ?.reaction === reaction
                ? null
                : reaction
          })
        )
      }
      handleCloseReactionPopup()
    },
    [dispatch, handleCloseReactionPopup, userId, chatId, message]
  )
  const onClickInternalLink = useCallback(
    (url: string) => {
      dispatch(pushRoute(url))
    },
    [dispatch]
  )

  // Only render reactions if user has message permissions
  const { canSendMessage } = useCanSendMessage(chatId)
  const renderReactions = () => {
    if (!canSendMessage) return null

    return (
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
            if (!reaction.reaction || !(reaction.reaction in reactionMap)) {
              return null
            }
            const Reaction = reactionMap[reaction.reaction as ReactionTypes]
            return (
              <Reaction
                className={styles.reactionEmoji}
                key={reaction.user_id}
                width={48}
                height={48}
                title={reactionUsers[decodeHashId(reaction.user_id)!]?.name}
                disableClickAnimation
              />
            )
          })
        ) : (
          <IconPlus className={styles.addReactionIcon} />
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(styles.root, {
        [styles.isAuthor]: isAuthor
      })}
    >
      <div
        className={cn(styles.bubble, {
          [styles.nonInteractive]: !canSendMessage
        })}
      >
        {links
          .filter((link) => link.type === 'url' && link.isLink)
          .slice(0, 1)
          .map((link) => (
            <LinkPreview
              key={`${link.value}-${link.start}-${link.end}`}
              href={link.href}
              chatId={chatId}
              messageId={message.message_id}
            />
          ))}
        <div className={styles.text}>
          <Linkify
            options={{
              attributes: {
                onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
                  const url = event.currentTarget.href

                  if (isAudiusUrl(url)) {
                    const path = getPathFromAudiusUrl(url)
                    event.nativeEvent.preventDefault()
                    onClickInternalLink(path ?? '/')
                  }
                }
              },
              target: (href) => {
                return isAudiusUrl(href) ? '' : '_blank'
              }
            }}
          >
            {message.message}
          </Linkify>
        </div>
        {renderReactions()}
        {hasTail ? (
          <div className={styles.tail}>
            <ChatTail />
          </div>
        ) : null}
      </div>
      {canSendMessage ? (
        <ReactionPopupMenu
          anchorRef={reactionButtonRef}
          isVisible={isReactionPopupVisible}
          onClose={handleCloseReactionPopup}
          position={
            isAuthor ? PopupPosition.BOTTOM_RIGHT : PopupPosition.BOTTOM_LEFT
          }
          onSelected={handleReactionSelected}
        />
      ) : null}
      {hasTail ? (
        <div className={styles.date}>
          {formatMessageDate(message.created_at)}
        </div>
      ) : null}
    </div>
  )
}
