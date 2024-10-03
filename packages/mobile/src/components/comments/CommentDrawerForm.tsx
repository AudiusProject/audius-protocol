import React from 'react'

import {
  useCurrentCommentSection,
  useEditComment,
  usePostComment
} from '@audius/common/context'
import type { ID } from '@audius/common/models'

import { Box } from '@audius/harmony-native'

import { CommentForm } from './CommentForm'

export const CommentDrawerForm = () => {
  const { editingComment, replyingToComment } = useCurrentCommentSection()
  const [postComment] = usePostComment()
  const [editComment] = useEditComment()

  const handlePostComment = (message: string, mentions?: ID[]) => {
    if (editingComment) {
      editComment(editingComment.id, message, mentions)
      return
    }

    postComment(message, replyingToComment?.id)
  }

  // TODO:
  const isLoading = false

  return (
    <Box p='l' backgroundColor='white'>
      <CommentForm onSubmit={handlePostComment} isLoading={isLoading} />
    </Box>
  )
}
