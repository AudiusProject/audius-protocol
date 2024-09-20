import React, { useCallback, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import {
  CommentSectionProvider,
  useCurrentCommentSection,
  useDeleteComment,
  usePinComment,
  useReportComment
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
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

type CommentOverflowMenuProps = {
  comment: Comment | ReplyComment
  disabled?: boolean
}

export const CommentOverflowMenu = (props: CommentOverflowMenuProps) => {
  const {
    comment: { id, userId },
    disabled
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
      text: isPinned ? messages.menuActions.unpin : messages.menuActions.pin,
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
      text: messages.menuActions.flag,
      callback: () => {
        setIsFlagConfirmationOpen(true)
        setIsFlagConfirmationVisible(true)
      }
    },
    isEntityOwner &&
      !isCommentOwner && {
        text: messages.menuActions.flagAndRemove,
        callback: () => {
          setIsFlagAndRemoveConfirmationOpen(true)
          setIsFlagAndRemoveConfirmationVisible(true)
        }
      },
    isEntityOwner &&
      !isCommentOwner && {
        text: messages.menuActions.muteUser,
        callback: () => {
          setIsMuteUserConfirmationOpen(true)
          setIsMuteUserConfirmationVisible(true)
        }
      },
    // TODO: check if receiving notifications
    isCommentOwner && {
      text: messages.menuActions.turnOffNotifications,
      callback: () => {} // TODO
    },
    isCommentOwner && {
      text: messages.menuActions.edit,
      callback: () => setEditingComment?.(props.comment)
    },
    isCommentOwner && {
      text: messages.menuActions.delete,
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
      content: messages.toasts.mutedUser,
      type: 'info'
    })
  }, [toast])

  const handleFlagComment = useCallback(() => {
    reportComment(id)
    toast({
      content: messages.toasts.flaggedAndRemoved,
      type: 'info'
    })
  }, [reportComment, id, toast])

  const handleFlagAndRemoveComment = useCallback(() => {
    reportComment(id)
    // TODO: remove comment
    toast({
      content: messages.toasts.flaggedAndRemoved,
      type: 'info'
    })
  }, [reportComment, id, toast])

  const handlePinComment = useCallback(() => {
    pinComment(id, !isPinned)
    toast({
      content: isPinned ? messages.toasts.unpinned : messages.toasts.pinned,
      type: 'info'
    })
  }, [id, isPinned, pinComment, toast])

  const handleDeleteComment = useCallback(() => {
    deleteComment(id)
    toast({
      content: messages.toasts.deleted,
      type: 'info'
    })
  }, [deleteComment, id, toast])

  return (
    <>
      <IconButton
        aria-label={messages.menuActions.moreActions}
        icon={IconKebabHorizontal}
        size='s'
        color='subdued'
        onPress={() => {
          setIsOpen(!isOpen)
          setIsVisible(!isVisible)
        }}
        disabled={disabled}
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
              header: messages.popups.flagAndRemove.title,
              description: messages.popups.flagAndRemove.body,
              confirm: messages.popups.flagAndRemove.confirm
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
              header: messages.popups.flagAndRemove.title,
              description: `Remove ${commentUser?.handle}'s comment?`,
              confirm: messages.popups.flagAndRemove.confirm
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
              header: messages.popups.pin.title,
              description: messages.popups.pin.body,
              confirm: messages.popups.pin.confirm
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
              header: messages.popups.delete.title,
              description: messages.popups.delete.body,
              confirm: messages.popups.delete.confirm
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
              header: messages.popups.muteUser.title,
              description: messages.popups.muteUser.body(commentUser?.handle),
              confirm: messages.popups.muteUser.confirm
            }}
            onConfirm={handleMuteUser}
          >
            <Hint>{messages.popups.muteUser.hint}</Hint>
          </ConfirmationDrawerWithoutRedux>
        ) : null}
      </Portal>
    </>
  )
}
