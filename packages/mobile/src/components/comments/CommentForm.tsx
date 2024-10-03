import { useCallback, useEffect, useRef, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import type { ID } from '@audius/common/models'
import type { TextInput as RNTextInput } from 'react-native'

import {
  Box,
  Flex,
  IconButton,
  IconClose,
  Text,
  useTheme
} from '@audius/harmony-native'

import { ComposerInput } from '../composer-input'
import { ProfilePicture } from '../core'

type CommentFormHelperTextProps = {
  replyingToUserHandle?: string
}

const CommentFormHelperText = (props: CommentFormHelperTextProps) => {
  const { replyingToUserHandle } = props
  const { replyingToComment, setReplyingToComment, setEditingComment } =
    useCurrentCommentSection()
  const { color, spacing } = useTheme()

  const text = replyingToComment
    ? messages.replyingTo(replyingToUserHandle ?? '')
    : messages.editing

  const handlePressClear = useCallback(() => {
    setReplyingToComment?.(undefined)
    setEditingComment?.(undefined)
  }, [])

  return (
    <Flex
      style={{
        borderColor: color.neutral.n150,
        backgroundColor: color.background.surface1,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderTopLeftRadius: spacing.unit1,
        borderTopRightRadius: spacing.unit1,
        padding: spacing.xs,
        paddingHorizontal: spacing.m
      }}
    >
      <Text size='s'>{text}</Text>
      <IconButton icon={IconClose} onPress={handlePressClear} />
    </Flex>
  )
}

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

  const showHelperText = editingComment || replyingToComment

  return (
    <Flex direction='row' gap='m' alignItems='center'>
      {currentUserId ? (
        <ProfilePicture
          userId={currentUserId}
          style={{ width: 40, height: 40, flexShrink: 0 }}
        />
      ) : null}
      <Flex flex={1}>
        {showHelperText ? (
          <CommentFormHelperText
            replyingToUserHandle={replyingToUser?.handle}
          />
        ) : null}
        <Box flex={1}>
          <ComposerInput
            isLoading={isLoading}
            messageId={messageId}
            entityId={entityId}
            presetMessage={initialMessage}
            placeholder={placeholder}
            onSubmit={handleSubmit}
            styles={{
              container: {
                borderTopLeftRadius: showHelperText ? 0 : 8,
                borderTopRightRadius: showHelperText ? 0 : 8
              }
            }}
          />
        </Box>
      </Flex>
    </Flex>
  )
}
