import React from 'react'

import {
  useCurrentCommentSection,
  useEditComment,
  usePostComment
} from '@audius/common/context'
import type { ID } from '@audius/common/models'
import { Status } from '@audius/common/models'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'

import { Box } from '@audius/harmony-native'

import { CommentForm } from './CommentForm'

export const CommentDrawerForm = () => {
  const { editingComment, replyingToComment } = useCurrentCommentSection()
  const [postComment, { status: postCommentStatus }] = usePostComment()
  const [editComment] = useEditComment()

  const handlePostComment = (message: string, mentions?: ID[]) => {
    if (editingComment) {
      editComment(editingComment.id, message, mentions)
      return
    }

    postComment(message, replyingToComment?.id)
  }

  const isLoading = postCommentStatus === Status.LOADING

  return (
    <Box p='l' backgroundColor='white'>
      <CommentForm
        onSubmit={handlePostComment}
        isLoading={isLoading}
        TextInputComponent={BottomSheetTextInput as any}
      />
    </Box>
  )
}
