import React, { useCallback, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import {
  CommentSectionProvider,
  useCurrentCommentSection,
  useDeleteComment,
  usePinComment,
  useReportComment
} from '@audius/common/context'
import { removeNullable } from '@audius/common/utils'
import type { Comment, ReplyComment } from '@audius/sdk'
import { Portal } from '@gorhom/portal'

import { Hint, IconButton, IconKebabHorizontal } from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'

import {
  ActionDrawerWithoutRedux,
  type ActionDrawerRow
} from '../action-drawer'
import { ConfirmationDrawerWithoutRedux } from '../drawers'

const messages = {
  pin: 'Pin',
  pinned: 'Comment pinned',
  pinComment: 'Pin Comment',
  pinCommentDescription:
    'If you already pinned a comment, this will replace it',
  unpin: 'Unpin',
  unpinned: 'Comment unpinned',
  muted: 'User muted',
  flag: 'Flag',
  flagAndRemove: 'Flag & Remove',
  flagComment: 'Flag Comment',
  flagged: 'Flagged comment',
  removed: 'Comment removed',
  muteUser: 'Mute User',
  muteUserHint:
    'This will not affect their ability to view your profile or interact with your content. ',
  turnOnNotifications: 'Turn On Notifications',
  turnOffNotifications: 'Turn Off Notifications',
  edit: 'Edit',
  delete: 'Delete',
  deleted: 'Comment deleted',
  deleteComment: 'Delete Comment',
  deleteCommentDescription: 'Delete your comment permanently?',
  moreActions: 'more actions'
}

type CommentOverflowMenuProps = {
  comment: Comment | ReplyComment
}

export const CommentOverflowMenu = (props: CommentOverflowMenuProps) => {
  const {
    comment: { id, userId }
  } = props

  const isPinned = 'isPinned' in props ? props.isPinned : false // pins dont exist on replies
  const { data: commentUser } = useGetUserById({
    id: Number(userId)
  })

  const { toast } = useToast()

  // Need isOpen and isVisible to account for the closing animation
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const [isFlagConfirmationOpen, setIsFlagConfirmationOpen] = useState(false)
  const [isFlagConfirmationVisible, setIsFlagConfirmationVisible] =
    useState(false)

  const [isFlagAndRemoveConfirmationOpen, setIsFlagAndRemoveConfirmationOpen] =
    useState(false)
  const [
    isFlagAndRemoveConfirmationVisible,
    setIsFlagAndRemoveConfirmationVisible
  ] = useState(false)

  const [isMuteUserConfirmationOpen, setIsMuteUserConfirmationOpen] =
    useState(false)
  const [isMuteUserConfirmationVisible, setIsMuteUserConfirmationVisible] =
    useState(false)

  const [isPinConfirmationOpen, setIsPinConfirmationOpen] = useState(false)
  const [isPinConfirmationVisible, setIsPinConfirmationVisible] =
    useState(false)

  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false)
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false)

  const { entityId, isEntityOwner, currentUserId, setEditingComment } =
    useCurrentCommentSection()
  const isCommentOwner = Number(userId) === currentUserId

  const [pinComment] = usePinComment()
  const [deleteComment] = useDeleteComment()
  const [reportComment] = useReportComment()

  const rows: ActionDrawerRow[] = [
    isEntityOwner && {
      text: isPinned ? messages.unpin : messages.pin,
      callback: () => {
        if (isPinned) {
          // Unpin the comment
          handlePinComment()
        } else {
          setIsPinConfirmationOpen(true)
          setIsPinConfirmationVisible(true)
        }
      }
    },
    !isCommentOwner && {
      text: messages.flag,
      callback: () => {
        setIsFlagConfirmationOpen(true)
        setIsFlagConfirmationVisible(true)
      }
    },
    isEntityOwner &&
      !isCommentOwner && {
        text: messages.flagAndRemove,
        callback: () => {
          setIsFlagAndRemoveConfirmationOpen(true)
          setIsFlagAndRemoveConfirmationVisible(true)
        }
      },
    isEntityOwner &&
      !isCommentOwner && {
        text: messages.muteUser,
        callback: () => {
          setIsMuteUserConfirmationOpen(true)
          setIsMuteUserConfirmationVisible(true)
        }
      },
    // TODO: check if receiving notifications
    isCommentOwner && {
      text: messages.turnOffNotifications,
      callback: () => {} // TODO
    },
    isCommentOwner && {
      text: messages.edit,
      callback: () => setEditingComment?.(props.comment)
    },
    isCommentOwner && {
      text: messages.delete,
      callback: () => {
        setIsDeleteConfirmationOpen(true)
        setIsDeleteConfirmationVisible(true)
      },
      isDestructive: true
    }
  ].filter(removeNullable)

  const handleMuteUser = useCallback(() => {
    // TODO
    toast({
      content: messages.muted,
      type: 'info'
    })
  }, [toast])

  const handleFlagComment = useCallback(() => {
    reportComment(id)
    toast({
      content: messages.flagged,
      type: 'info'
    })
  }, [reportComment, id, toast])

  const handleFlagAndRemoveComment = useCallback(() => {
    reportComment(id)
    // TODO: remove comment
    toast({
      content: messages.removed,
      type: 'info'
    })
  }, [reportComment, id, toast])

  const handlePinComment = useCallback(() => {
    pinComment(id, !isPinned)
    toast({
      content: isPinned ? messages.unpinned : messages.pinned,
      type: 'info'
    })
  }, [id, isPinned, pinComment, toast])

  const handleDeleteComment = useCallback(() => {
    deleteComment(id)
    toast({
      content: messages.deleted,
      type: 'info'
    })
  }, [deleteComment, id, toast])

  return (
    <>
      <IconButton
        aria-label={messages.moreActions}
        icon={IconKebabHorizontal}
        size='s'
        color='subdued'
        onPress={() => {
          setIsOpen(!isOpen)
          setIsVisible(!isVisible)
        }}
      />

      <Portal hostName='DrawerPortal'>
        {isVisible ? (
          <CommentSectionProvider entityId={entityId}>
            <ActionDrawerWithoutRedux
              rows={rows}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              onClosed={() => setIsVisible(false)}
            />
          </CommentSectionProvider>
        ) : null}

        {isFlagConfirmationVisible ? (
          <ConfirmationDrawerWithoutRedux
            isOpen={isFlagConfirmationOpen}
            onClose={() => setIsFlagConfirmationOpen(false)}
            onClosed={() => setIsFlagConfirmationVisible(false)}
            messages={{
              header: messages.flagComment,
              description: `Flag ${commentUser?.handle}'s comment?`,
              confirm: messages.flagComment
            }}
            onConfirm={handleFlagComment}
          />
        ) : null}

        {isFlagAndRemoveConfirmationVisible ? (
          <ConfirmationDrawerWithoutRedux
            isOpen={isFlagAndRemoveConfirmationOpen}
            onClose={() => setIsFlagAndRemoveConfirmationOpen(false)}
            onClosed={() => setIsFlagAndRemoveConfirmationVisible(false)}
            messages={{
              header: messages.flagComment,
              description: `Remove ${commentUser?.handle}'s comment?`,
              confirm: messages.flagAndRemove
            }}
            onConfirm={handleFlagAndRemoveComment}
          />
        ) : null}

        {isPinConfirmationVisible ? (
          <ConfirmationDrawerWithoutRedux
            isOpen={isPinConfirmationOpen}
            onClose={() => setIsPinConfirmationOpen(false)}
            onClosed={() => setIsPinConfirmationVisible(false)}
            variant='affirmative'
            messages={{
              header: messages.pinComment,
              description: messages.pinCommentDescription,
              confirm: messages.pin
            }}
            onConfirm={handlePinComment}
          />
        ) : null}

        {isDeleteConfirmationVisible ? (
          <ConfirmationDrawerWithoutRedux
            isOpen={isDeleteConfirmationOpen}
            onClose={() => setIsDeleteConfirmationOpen(false)}
            onClosed={() => setIsDeleteConfirmationVisible(false)}
            messages={{
              header: messages.deleteComment,
              description: messages.deleteCommentDescription,
              confirm: messages.delete
            }}
            onConfirm={handleDeleteComment}
          />
        ) : null}

        {isMuteUserConfirmationVisible ? (
          <ConfirmationDrawerWithoutRedux
            isOpen={isMuteUserConfirmationOpen}
            onClose={() => setIsMuteUserConfirmationOpen(false)}
            onClosed={() => setIsMuteUserConfirmationVisible(false)}
            messages={{
              header: messages.muteUser,
              description: `Mute ${commentUser?.handle} from commenting on your tracks?`,
              confirm: messages.muteUser
            }}
            onConfirm={handleMuteUser}
          >
            <Hint>{messages.muteUserHint}</Hint>
          </ConfirmationDrawerWithoutRedux>
        ) : null}
      </Portal>
    </>
  )
}
