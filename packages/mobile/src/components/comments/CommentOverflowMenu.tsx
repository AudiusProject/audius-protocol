import React, { useState } from 'react'

import {
  CommentSectionProvider,
  useCurrentCommentSection,
  useDeleteComment,
  usePinComment,
  useReportComment
} from '@audius/common/context'
import { removeNullable } from '@audius/common/utils'
import type { Comment } from '@audius/sdk'
import { Portal } from '@gorhom/portal'

import { IconButton, IconKebabHorizontal } from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'

import {
  ActionDrawerWithoutRedux,
  type ActionDrawerRow
} from '../action-drawer'
import { ConfirmationDrawerWithoutRedux } from '../drawers'

const messages = {
  pin: 'Pin',
  pinned: 'Comment pinned',
  unpin: 'Unpin',
  unpinned: 'Comment unpinned',
  flagAndRemove: 'Flag & Remove',
  muteUser: 'Mute User',
  turnOnNotifications: 'Turn On Notifications',
  turnOffNotifications: 'Turn Off Notifications',
  edit: 'Edit',
  delete: 'Delete',
  moreActions: 'more actions'
}

type CommentOverflowMenuProps = {
  comment: Comment
}

export const CommentOverflowMenu = (props: CommentOverflowMenuProps) => {
  const {
    comment: { id, userId, isPinned }
  } = props
  const { toast } = useToast()

  // Need isOpen and isVisible to account for the closing animation
  // TODO: refactor into a custom hook
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

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
        pinComment(id, !isPinned)
        toast({
          content: isPinned ? messages.unpinned : messages.pinned,
          type: 'info'
        })
      }
    },
    isEntityOwner &&
      !isCommentOwner && {
        text: messages.flagAndRemove,
        callback: () => reportComment(id)
      },
    !isCommentOwner && {
      text: messages.muteUser,
      callback: () => {} // TODO
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

        {isDeleteConfirmationVisible ? (
          <ConfirmationDrawerWithoutRedux
            isOpen={isDeleteConfirmationOpen}
            onClose={() => setIsDeleteConfirmationOpen(false)}
            onClosed={() => setIsDeleteConfirmationVisible(false)}
            messages={{
              header: 'Delete Comment',
              description: 'Delete your comment permanently?',
              confirm: 'Delete',
              cancel: 'Cancel'
            }}
            icon={undefined}
            onConfirm={() => deleteComment(id)}
          />
        ) : null}
      </Portal>
    </>
  )
}
