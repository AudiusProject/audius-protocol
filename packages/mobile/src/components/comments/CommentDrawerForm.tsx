import React from 'react'

import { usePostComment } from '@audius/common/context'
import { Status } from '@audius/common/models'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'

import { Box } from '@audius/harmony-native'

import { CommentForm } from './CommentForm'

export const CommentDrawerForm = () => {
  const [postComment, { status: postCommentStatus }] = usePostComment()

  const handlePostComment = (message: string) => {
    postComment(message, undefined)
  }

  return (
    <Box p='l' backgroundColor='white'>
      <CommentForm
        onSubmit={handlePostComment}
        isLoading={postCommentStatus === Status.LOADING}
        TextInputComponent={BottomSheetTextInput as any}
      />
    </Box>
  )
}
