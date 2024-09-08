import { useCallback, useMemo, useState } from 'react'

import {
  useCurrentCommentSection,
  usePinComment,
  useReactToComment,
  useReportComment
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import {
  Flex,
  IconButton,
  IconHeart,
  IconKebabHorizontal,
  IconNotificationOff,
  IconPencil,
  IconPin,
  IconShieldCheck,
  IconTrash,
  IconUserUnfollow,
  PopupMenu,
  PopupMenuItem,
  Text,
  TextLink
} from '@audius/harmony'
import { Comment, ReplyComment } from '@audius/sdk'
import { useToggle } from 'react-use'

import { ConfirmationModal } from 'components/confirmation-modal'
import { DownloadMobileAppDrawer } from 'components/download-mobile-app-drawer/DownloadMobileAppDrawer'
import { useIsMobile } from 'hooks/useIsMobile'

type CommentActionBarProps = {
  comment: Comment | ReplyComment
  isDisabled: boolean
  onClickEdit: () => void
  onClickReply: () => void
  onClickDelete: () => void
}
export const CommentActionBar = ({
  comment,
  isDisabled,
  onClickEdit,
  onClickReply,
  onClickDelete
}: CommentActionBarProps) => {
  // comment from props
  const { reactCount, id: commentId } = comment
  const isPinned = 'isPinned' in comment ? comment.isPinned : false // pins dont exist on replies

  // context actions & values
  const { currentUserId, isEntityOwner } = useCurrentCommentSection()

  const [reactToComment] = useReactToComment()

  const [reportComemnt] = useReportComment()
  const [isFlagConfirmationOpen, toggleFlagConfirmationOpen] = useToggle(false)

  const [pinComment] = usePinComment()
  const [isMobileAppDrawerOpen, toggleIsMobileAppDrawer] = useToggle(false)
  const isMobile = useIsMobile()

  // component state
  const [reactionState, setReactionState] = useState(false) // TODO: temporary - eventually this will live in metadata

  const isCommentOwner = Number(comment.userId) === currentUserId
  const isUserGettingNotifs = true // TODO: Need to set up API to provide this
  const notificationsMuted = false // TODO: Need to set up API to provide this

  const handleCommentReact = useCallback(() => {
    setReactionState(!reactionState)
    reactToComment(commentId, !reactionState)
  }, [commentId, reactToComment, reactionState])

  const handleCommentDelete = useCallback(() => {
    onClickDelete()
  }, [onClickDelete])

  const handleCommentPin = useCallback(() => {
    pinComment(commentId, !isPinned)
  }, [commentId, isPinned, pinComment])

  const handleClickReply = useCallback(() => {
    if (isMobile) {
      toggleIsMobileAppDrawer()
    } else {
      onClickReply()
    }
  }, [isMobile, onClickReply, toggleIsMobileAppDrawer])

  const popupMenuItems = useMemo(() => {
    let items: PopupMenuItem[] = []
    const entityOwnerMenuItems: PopupMenuItem[] = [
      {
        onClick: handleCommentPin,
        text: isPinned ? messages.unpin : messages.pin,
        icon: <IconPin />
      }
    ]
    const commentOwnerMenuItems: PopupMenuItem[] = [
      { onClick: onClickEdit, text: messages.edit, icon: <IconPencil /> }
    ]
    const nonCommentOwnerItems: PopupMenuItem[] = [
      {
        onClick: toggleFlagConfirmationOpen,
        text: messages.report,
        icon: <IconShieldCheck /> // TODO: temporary icon
      },
      { onClick: () => {}, text: messages.block, icon: <IconUserUnfollow /> } // TODO - nothing implemented yet
    ]
    const muteNotifs: PopupMenuItem = {
      onClick: () => {}, // TODO - nothing implemented yet here
      text: notificationsMuted ? messages.unmuteNotifs : messages.muteNotifs,
      icon: <IconNotificationOff />
    }
    const deleteComment: PopupMenuItem = {
      onClick: handleCommentDelete,
      text: messages.delete,
      icon: <IconTrash />
    }

    if (isEntityOwner) {
      items = items.concat(entityOwnerMenuItems)
    }
    if (isCommentOwner) {
      items = items.concat(commentOwnerMenuItems)
      if (isUserGettingNotifs) {
        items.push(muteNotifs)
      }
    }
    if (!isCommentOwner) {
      items = items.concat(nonCommentOwnerItems)
    }
    if (isCommentOwner || isEntityOwner) {
      items.push(deleteComment)
    }
    return items
  }, [
    handleCommentPin,
    isPinned,
    onClickEdit,
    toggleFlagConfirmationOpen,
    notificationsMuted,
    handleCommentDelete,
    isEntityOwner,
    isCommentOwner,
    isUserGettingNotifs
  ])

  return (
    <Flex gap='l' alignItems='center'>
      <Flex alignItems='center'>
        {/* TODO: we should use FavoriteButton here */}
        <IconButton
          icon={IconHeart}
          color={reactionState ? 'active' : 'subdued'}
          aria-label='Heart comment'
          onClick={handleCommentReact}
          disabled={isDisabled}
        />
        <Text color={isDisabled ? 'subdued' : 'default'}> {reactCount}</Text>
      </Flex>
      <TextLink
        variant='subdued'
        onClick={handleClickReply}
        size='m'
        disabled={isDisabled}
      >
        Reply
      </TextLink>

      <PopupMenu
        items={popupMenuItems}
        renderTrigger={(anchorRef, triggerPopup) => (
          <IconButton
            aria-label='Show Comment Management Options'
            icon={IconKebabHorizontal}
            color='subdued'
            ref={anchorRef}
            disabled={isDisabled}
            onClick={() => {
              if (isMobile) {
                toggleIsMobileAppDrawer()
              } else {
                triggerPopup()
              }
            }}
          />
        )}
      />
      <DownloadMobileAppDrawer
        isOpen={isMobileAppDrawerOpen}
        onClose={toggleIsMobileAppDrawer}
      />
      <ConfirmationModal
        messages={{
          header: messages.flagComment,
          description: messages.flagCommentDescription,
          confirm: messages.flag
        }}
        isOpen={isFlagConfirmationOpen}
        onClose={toggleFlagConfirmationOpen}
        title={messages.flagComment}
        description={messages.flagCommentDescription}
        onConfirm={() => reportComemnt(commentId)}
      />
    </Flex>
  )
}
