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

  const { artistId, entityId, isEntityOwner, currentUserId } =
    useCurrentCommentSection()

  // TODO: Move to context?
  const currentUserIdString = encodeHashId(currentUserId)
  const isCommentOwner = userId === currentUserIdString

  const [pinComment] = usePinComment()
  const [deleteComment] = useDeleteComment()
  const [reportComment] = useReportComment()

  const rows: ActionDrawerRow[] = [
    isEntityOwner && {
      text: 'Pin',
      callback: () => pinComment(id, isPinned)
    },
    isEntityOwner &&
      !isCommentOwner && {
        text: 'Flag & Remove',
        callback: () => reportComment(id)
      },
    !isCommentOwner && {
      text: 'Mute User',
      callback: () => {} // TODO
    },
    // TODO: check if receiving notifications
    isCommentOwner && {
      text: 'Turn Off Notifications',
      callback: () => {} // TODO
    },
    isCommentOwner && {
      text: 'Edit',
      callback: () => {} // TODO
    },
    isCommentOwner && {
      text: 'Delete',
      callback: () => deleteComment(id),
      isDestructive: true
    }
  ].filter(removeNullable)

  return (
    <>
      <IconButton
        aria-label='more actions'
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
          <CommentSectionProvider
            currentUserId={currentUserId}
            artistId={artistId}
            entityId={entityId}
            isEntityOwner={isEntityOwner}
            playTrack={() => {}}
          >
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
