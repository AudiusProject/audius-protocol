import type { RefObject } from 'react'
import React from 'react'

import {
  useCurrentCommentSection,
  useEditComment,
  usePostComment
} from '@audius/common/context'
import type { ID, UserMetadata } from '@audius/common/models'
import type { BottomSheetFlatListMethods } from '@gorhom/bottom-sheet'

import { Box } from '@audius/harmony-native'

import { CommentForm } from './CommentForm'

type CommentDrawerFormProps = {
  commentListRef: RefObject<BottomSheetFlatListMethods>
  onAutocompleteChange?: (isActive: boolean, value: string) => void
  setAutocompleteHandler?: (user: UserMetadata) => void
}

export const CommentDrawerForm = (props: CommentDrawerFormProps) => {
  const { commentListRef, onAutocompleteChange, setAutocompleteHandler } = props
  const {
    editingComment,
    replyingToComment,
    setReplyingToComment,
    setEditingComment
  } = useCurrentCommentSection()
  const [postComment] = usePostComment()
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

  // TODO:
  const isLoading = false

  return (
    <Box p='l' backgroundColor='white'>
      <CommentForm
        onSubmit={handlePostComment}
        onAutocompleteChange={onAutocompleteChange}
        setAutocompleteHandler={setAutocompleteHandler}
        isLoading={isLoading}
      />
    </Box>
  )
}
