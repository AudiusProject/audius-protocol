import React, { useState } from 'react'

import {
  CommentSectionProvider,
  useCurrentCommentSection,
  useDeleteComment,
  usePinComment
} from '@audius/common/context'
import { accountSelectors } from '@audius/common/store'
import { Portal } from '@gorhom/portal'
import { useSelector } from 'react-redux'

import { IconButton, IconKebabHorizontal } from '@audius/harmony-native'

import {
  ActionDrawerWithoutRedux,
  type ActionDrawerRow
} from '../action-drawer'

const { getUserId } = accountSelectors

type CommentOverflowMenuProps = {
  commentId: string
  isPinned: boolean
}

export const CommentOverflowMenu = (props: CommentOverflowMenuProps) => {
  const { commentId, isPinned } = props

  // Need isOpen and isVisible to account for the closing animation
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const currentUserId = useSelector(getUserId)
  const { artistId, entityId, isEntityOwner } = useCurrentCommentSection()

  const [pinComment] = usePinComment()
  const [deleteComment] = useDeleteComment()

  const rows: ActionDrawerRow[] = [
    {
      text: 'Pin',
      callback: () => pinComment(commentId, isPinned)
    },
    {
      text: 'Delete',
      callback: () => deleteComment(commentId),
      isDestructive: true
    }
  ]

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
