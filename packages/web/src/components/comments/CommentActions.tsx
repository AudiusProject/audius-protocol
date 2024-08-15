import { useCallback, useEffect, useMemo, useState } from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
import { Status } from '@audius/common/models'
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
  IconVisibilityHidden,
  IconVolumeLevel0,
  PopupMenu,
  PopupMenuItem,
  Text,
  TextLink
} from '@audius/harmony'
import { Comment } from '@audius/sdk'
import { usePrevious } from 'react-use'

const messages = {
  pin: 'Pin Comment',
  edit: 'Edit Comment',
  delete: 'Delete Comment',
  report: 'Report Comment',
  block: 'Mute User',
  muteNotifs: 'Mute Notifications'
}

type CommentActionsProps = {
  comment: Comment
  isDisabled: boolean
  onClickEdit: () => void
  onClickReply: () => void
  onClickDelete: () => void
}
export const CommentActions = ({
  comment,
  isDisabled,
  onClickEdit,
  onClickReply,
  onClickDelete
}: CommentActionsProps) => {
  const { reactCount, id: commentId } = comment

  const {
    currentUserId,
    useDeleteComment,
    useReactToComment,
    usePinComment,
    isEntityOwner
  } = useCurrentCommentSection()

  const [reactionState, setReactionState] = useState(false) // TODO: need to pull starting value from metadata
  const [isDeleting, setIsDeleting] = useState(false)

  const [reactToComment] = useReactToComment()
  const [pinComment] = usePinComment()
  const [deleteComment, { status: deleteCommentStatus }] = useDeleteComment()

  const prevDeleteCommentStatus = usePrevious(deleteCommentStatus)

  useEffect(() => {
    if (
      isDeleting &&
      (deleteCommentStatus === Status.SUCCESS ||
        deleteCommentStatus === Status.ERROR) &&
      prevDeleteCommentStatus !== deleteCommentStatus
    ) {
      setIsDeleting(false)
    }
  }, [isDeleting, deleteCommentStatus, prevDeleteCommentStatus])

  const isCommentOwner = Number(comment.userId) === currentUserId // TODO: need to check against current user (not really feasible with modck data)
  const isUserGettingNotifs = true // TODO: Need to set up API to provide this

  const handleCommentReact = useCallback(() => {
    setReactionState(!reactionState)
    reactToComment(commentId, !reactionState)
  }, [commentId, reactToComment, reactionState])

  const handleCommentDelete = useCallback(() => {
    onClickDelete()
    setIsDeleting(true)
    deleteComment(commentId)
  }, [commentId, deleteComment, onClickDelete])

  const handleCommentPin = useCallback(() => {
    pinComment(commentId)
  }, [commentId, pinComment])

  const popupMenuItems = useMemo(() => {
    let items: PopupMenuItem[] = []
    const entityOwnerMenuItems: PopupMenuItem[] = [
      { onClick: handleCommentPin, text: messages.pin, icon: <IconPin /> }
    ]
    const commentOwnerMenuItems: PopupMenuItem[] = [
      { onClick: onClickEdit, text: messages.edit, icon: <IconPencil /> }
    ]
    const nonCommentOwnerItems: PopupMenuItem[] = [
      {
        onClick: () => {}, // TODO - nothing implemented yet here
        text: messages.report,
        icon: <IconShieldCheck />
      }, // TODO: temporary icon
      { onClick: () => {}, text: messages.block, icon: <IconUserUnfollow /> } // TODO - nothing implemented yet here
    ]
    const muteNotifs: PopupMenuItem = {
      onClick: () => {}, // TODO - nothing implemented yet here
      text: messages.muteNotifs,
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
    handleCommentDelete,
    handleCommentPin,
    isCommentOwner,
    isEntityOwner,
    isUserGettingNotifs,
    onClickEdit
  ])

  return (
    <Flex gap='l' alignItems='center'>
      <Flex alignItems='center'>
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
        onClick={onClickReply}
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
              triggerPopup()
            }}
          />
        )}
      />
    </Flex>
  )
}
