import React from 'react'

import { usePostComment } from '@audius/common/context'
import { Status } from '@audius/common/models'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'

import { Box } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'

import { CommentForm } from './CommentForm'

const useStyles = makeStyles(({ palette }) => ({
  form: {
    backgroundColor: palette.white
  }
}))

export const CommentDrawerForm = () => {
  const styles = useStyles()
  const [postComment, { status: postCommentStatus }] = usePostComment()

  const handlePostComment = (message: string) => {
    postComment(message, undefined)
  }

  return (
    <Box
      style={{
        ...styles.form
      }}
    >
      <Box p='l'>
        <CommentForm
          onSubmit={handlePostComment}
          isLoading={postCommentStatus === Status.LOADING}
          TextInputComponent={BottomSheetTextInput as any}
        />
      </Box>
    </Box>
  )
}
