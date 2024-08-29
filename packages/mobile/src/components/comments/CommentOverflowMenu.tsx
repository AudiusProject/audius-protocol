import React, { useState } from 'react'

import {
  CommentSectionProvider,
  useCurrentCommentSection,
  useDeleteComment,
  usePinComment,
  useReportComment
} from '@audius/common/context'
import { encodeHashId, removeNullable } from '@audius/common/utils'
import type { Comment } from '@audius/sdk'
import { Portal } from '@gorhom/portal'

import { IconButton, IconKebabHorizontal } from '@audius/harmony-native'

import {
  ActionDrawerWithoutRedux,
  type ActionDrawerRow
} from '../action-drawer'

const messages = {
  pin: 'Pin',
  flagAndRemove: 'Flag & Remove',
  muteUser: 'Mute User',
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

  // Need isOpen and isVisible to account for the closing animation
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const { entityId, isEntityOwner, currentUserId } = useCurrentCommentSection()

  // TODO: Move to context?
  const currentUserIdString = encodeHashId(currentUserId)
  const isCommentOwner = userId === currentUserIdString

  const [pinComment] = usePinComment()
  const [deleteComment] = useDeleteComment()
  const [reportComment] = useReportComment()

  const rows: ActionDrawerRow[] = [
    isEntityOwner && {
      text: messages.pin,
      callback: () => pinComment(id, isPinned)
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
      callback: () => {} // TODO
    },
    isCommentOwner && {
      text: messages.delete,
      callback: () => deleteComment(id),
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

      {isVisible ? (
        <Portal hostName='DrawerPortal'>
          <CommentSectionProvider entityId={entityId}>
            <ActionDrawerWithoutRedux
              rows={rows}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              onClosed={() => setIsVisible(false)}
            />
          </CommentSectionProvider>
        </Portal>
      ) : null}
    </>
  )
}
