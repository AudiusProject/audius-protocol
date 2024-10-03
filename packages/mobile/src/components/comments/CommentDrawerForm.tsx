import type { RefObject } from 'react'
import React from 'react'

import {
  useCurrentCommentSection,
  useEditComment,
  usePostComment
} from '@audius/common/context'
import type { ID } from '@audius/common/models'
import { Status } from '@audius/common/models'
import type { BottomSheetFlatListMethods } from '@gorhom/bottom-sheet'

import { Box } from '@audius/harmony-native'

import { CommentForm } from './CommentForm'

export const CommentDrawerForm = (props: {
  commentListRef: RefObject<BottomSheetFlatListMethods>
}) => {
  const { commentListRef } = props
  const {
    editingComment,
    replyingToComment,
    setReplyingToComment,
    setEditingComment
  } = useCurrentCommentSection()
  const [postComment, { status: postCommentStatus }] = usePostComment()
  const [editComment] = useEditComment()

  const handlePostComment = (message: string, mentions?: ID[]) => {
    if (editingComment) {
      editComment(editingComment.id, message, mentions)
      return
    }

    postComment(message, replyingToComment?.id)

    // Scroll to top of comments when posting a new comment
    if (!editingComment && !replyingToComment) {
      commentListRef.current?.scrollToOffset({ offset: 0 })
    }

    setReplyingToComment?.(undefined)
    setEditingComment?.(undefined)
  }

  const isLoading = postCommentStatus === Status.LOADING

  return (
    <Box p='l' backgroundColor='white'>
      <CommentForm onSubmit={handlePostComment} isLoading={isLoading} />
    </Box>
  )
}
