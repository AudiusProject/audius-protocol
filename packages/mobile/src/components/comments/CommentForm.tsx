import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import type { ID, UserMetadata } from '@audius/common/models'
import type { TextInput as RNTextInput } from 'react-native'

import {
  Box,
  Flex,
  IconButton,
  IconClose,
  spacing,
  Text,
  useTheme
} from '@audius/harmony-native'

import { ComposerInput } from '../composer-input'
import { ProfilePicture } from '../core'

type CommentFormHelperTextProps = {
  replyingToUserHandle?: string
}

const replyInitialMessage = (handle: string) => `@${handle} `

const CommentFormHelperText = (props: CommentFormHelperTextProps) => {
  const { replyingToUserHandle } = props
  const { replyingAndEditingState, setReplyingAndEditingState } =
    useCurrentCommentSection()
  const { color, spacing } = useTheme()
  const { replyingToComment } = replyingAndEditingState ?? {}

  const text = replyingToComment
    ? messages.replyingTo(replyingToUserHandle ?? '')
    : messages.editing

  const handlePressClear = useCallback(() => {
    setReplyingAndEditingState?.(undefined)
  }, [setReplyingAndEditingState])

  return (
    <Flex
      direction='row'
      alignItems='center'
      justifyContent='space-between'
      style={{
        borderColor: color.neutral.n150,
        backgroundColor: color.background.surface1,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderTopLeftRadius: spacing.unit1,
        borderTopRightRadius: spacing.unit1,
        padding: spacing.xs,
        paddingLeft: spacing.m
      }}
    >
      <Text size='s'>{text}</Text>
      <IconButton
        size='2xs'
        icon={IconClose}
        onPress={handlePressClear}
        color='default'
        hitSlop={10}
      />
    </Flex>
  )
}

type CommentFormProps = {
  onSubmit: (commentMessage: string, mentions?: ID[]) => void
  initialValue?: string
  isLoading?: boolean
  onAutocompleteChange?: (isActive: boolean, value: string) => void
  setAutocompleteHandler?: (handler: (user: UserMetadata) => void) => void
  TextInputComponent?: typeof RNTextInput
}

export const CommentForm = (props: CommentFormProps) => {
  const {
    isLoading,
    setAutocompleteHandler,
    onAutocompleteChange,
    onSubmit,
    initialValue,
    TextInputComponent
  } = props
  const [messageId, setMessageId] = useState(0)
  const [initialMessage, setInitialMessage] = useState(initialValue)
  const { currentUserId, commentIds, entityId, replyingAndEditingState } =
    useCurrentCommentSection()
  const { replyingToComment, editingComment } = replyingAndEditingState ?? {}
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
      setInitialMessage(replyInitialMessage(replyingToUser.handle))
      if (ref.current) {
        ref.current.focus()
      }
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

  const handleLayout = useCallback(() => {
    if ((replyingToComment || editingComment) && ref.current) {
      // Set the cursor position (required for android)
      const initialMessageLength = initialMessage?.length ?? 0
      ref.current.setSelection(initialMessageLength, initialMessageLength)
    }
  }, [editingComment, initialMessage?.length, replyingToComment])

  const placeholder = commentIds?.length
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
            ref={ref}
            onAutocompleteChange={onAutocompleteChange}
            setAutocompleteHandler={setAutocompleteHandler}
            isLoading={isLoading}
            messageId={messageId}
            entityId={entityId}
            presetMessage={initialMessage}
            placeholder={placeholder}
            onSubmit={handleSubmit}
            displayCancelAccessory={!showHelperText}
            TextInputComponent={TextInputComponent}
            onLayout={handleLayout}
            styles={{
              container: {
                borderTopLeftRadius: showHelperText ? 0 : spacing.unit1,
                borderTopRightRadius: showHelperText ? 0 : spacing.unit1
              }
            }}
          />
        </Box>
      </Flex>
    </Flex>
  )
}
