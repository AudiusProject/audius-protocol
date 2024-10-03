import { useEffect, useRef, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import type { ID } from '@audius/common/models'
import type { TextInput as RNTextInput } from 'react-native'

import { Box, Flex } from '@audius/harmony-native'

import { ComposerInput } from '../composer-input'
import { ProfilePicture } from '../core'

type CommentFormProps = {
  onSubmit: (commentMessage: string, mentions?: ID[]) => void
  initialValue?: string
  isLoading?: boolean
}

export const CommentForm = (props: CommentFormProps) => {
  const { isLoading, onSubmit, initialValue } = props
  const [messageId, setMessageId] = useState(0)
  const [initialMessage, setInitialMessage] = useState(initialValue)
  const {
    currentUserId,
    comments,
    entityId,
    replyingToComment,
    editingComment
  } = useCurrentCommentSection()
  const ref = useRef<RNTextInput>(null)

  const replyingToUserId = Number(replyingToComment?.userId)
  const { data: replyingToUser } = useGetUserById(
    {
      id: replyingToUserId
    },
    { disabled: !replyingToComment }
  )

  // TODO: Add mentions back here
  const handleSubmit = (message: string) => {
    onSubmit(message)
    setMessageId((id) => ++id)
  }

  /**
   * Populate and focus input when replying to a comment
   */
  useEffect(() => {
    if (replyingToComment && replyingToUser) {
      setInitialMessage(`@${replyingToUser.handle} `)
      ref.current?.focus()
    }
  }, [replyingToComment, replyingToUser])

  /**
   * Populate and focus input when editing a comment
   */
  useEffect(() => {
    if (editingComment) {
      setInitialMessage(editingComment.message)
      ref.current?.focus()
    }
  }, [editingComment])

  const placeholder = comments?.length
    ? messages.addComment
    : messages.firstComment

  return (
    <Flex direction='row' gap='m' alignItems='center'>
      {currentUserId ? (
        <ProfilePicture
          userId={currentUserId}
          style={{ width: 40, height: 40, flexShrink: 0 }}
        />
      ) : null}
      <Box flex={1}>
        <ComposerInput
          ref={ref}
          isLoading={isLoading}
          messageId={messageId}
          entityId={entityId}
          presetMessage={initialMessage}
          placeholder={placeholder}
          onSubmit={handleSubmit}
        />
      </Box>
    </Flex>
  )
}
