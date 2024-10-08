import type { RefObject } from 'react'
import React from 'react'

import {
  useCurrentCommentSection,
  useEditComment,
  usePostComment
} from '@audius/common/context'
import type { ID, UserMetadata } from '@audius/common/models'
import {
  BottomSheetTextInput,
  type BottomSheetFlatListMethods
} from '@gorhom/bottom-sheet'

import { Box } from '@audius/harmony-native'

import { CommentForm } from './CommentForm'

type CommentDrawerFormProps = {
  commentListRef: RefObject<BottomSheetFlatListMethods>
  onAutocompleteChange?: (isActive: boolean, value: string) => void
  setAutocompleteHandler?: (handler: (user: UserMetadata) => void) => void
}

export const CommentDrawerForm = (props: CommentDrawerFormProps) => {
  const { commentListRef, onAutocompleteChange, setAutocompleteHandler } = props
  const { replyingAndEditingState, setReplyingAndEditingState } =
    useCurrentCommentSection()
  const { replyingToComment, replyingToCommentId, editingComment } =
    replyingAndEditingState ?? {}
  const [postComment] = usePostComment()
  const [editComment] = useEditComment()

  const handlePostComment = (message: string, mentions?: ID[]) => {
    if (editingComment) {
      editComment(editingComment.id, message, mentions)
    } else {
      postComment(message, replyingToCommentId ?? replyingToComment?.id)
    }

    // Scroll to top of comments when posting a new comment
    if (!editingComment && !replyingToComment) {
      commentListRef.current?.scrollToOffset({ offset: 0 })
    }

    setReplyingAndEditingState?.(undefined)
  }

  // TODO:
  const isLoading = false

  return (
    <Box p='l' backgroundColor='white'>
      <CommentForm
        onSubmit={handlePostComment}
        onAutocompleteChange={onAutocompleteChange}
        setAutocompleteHandler={setAutocompleteHandler}
        isLoading={isLoading}
        TextInputComponent={BottomSheetTextInput as any}
      />
    </Box>
  )
}
