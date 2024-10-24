import { useCallback, useEffect, useRef, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { Name, type ID, type UserMetadata } from '@audius/common/models'
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
import { make, track } from 'app/services/analytics'

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
  onSubmit?: (commentMessage: string, mentions?: ID[]) => void
  initialValue?: string
  isLoading?: boolean
  onAutocompleteChange?: (isActive: boolean, value: string) => void
  setAutocompleteHandler?: (handler: (user: UserMetadata) => void) => void
  TextInputComponent?: typeof RNTextInput
  autoFocus?: boolean
  isPreview?: boolean
}

export const CommentForm = (props: CommentFormProps) => {
  const {
    isLoading,
    setAutocompleteHandler,
    onAutocompleteChange,
    onSubmit = () => {},
    initialValue,
    TextInputComponent,
    autoFocus,
    isPreview
  } = props
  const [messageId, setMessageId] = useState(0)
  const [initialMessage, setInitialMessage] = useState(initialValue)
  const { currentUserId, entityId, replyingAndEditingState } =
    useCurrentCommentSection()
  const { replyingToComment, editingComment } = replyingAndEditingState ?? {}
  const ref = useRef<RNTextInput>(null)
  const adjustedCursorPosition = useRef(false)

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

  const focusInput = useCallback(() => {
    // setTimeout is required to focus the input on android
    setTimeout(() => ref.current?.focus())
  }, [ref])

  /**
   * Populate and focus input when replying to a comment
   */
  useEffect(() => {
    if (replyingToComment && replyingToUser) {
      setInitialMessage(replyInitialMessage(replyingToUser.handle))
      focusInput()
    }
  }, [replyingToComment, replyingToUser, focusInput])

  /**
   * Populate and focus input when editing a comment
   */
  useEffect(() => {
    if (editingComment) {
      setInitialMessage(editingComment.message)
      focusInput()
    }
  }, [editingComment, focusInput])

  useEffect(() => {
    if (autoFocus) {
      focusInput()
    }
  }, [autoFocus, focusInput])

  const handleLayout = useCallback(() => {
    if (
      (replyingToComment || editingComment) &&
      ref.current &&
      !adjustedCursorPosition.current
    ) {
      // Set the cursor position (required for android)
      const initialMessageLength = initialMessage?.length ?? 0
      ref.current.setSelection(initialMessageLength, initialMessageLength)
      adjustedCursorPosition.current = true
    }
  }, [editingComment, initialMessage?.length, replyingToComment])

  const handleFocus = useCallback(() => {
    track(
      make({
        eventName: Name.COMMENTS_FOCUS_COMMENT_INPUT,
        trackId: entityId,
        source: isPreview ? 'comment_preview' : 'comment_input'
      })
    )
  }, [entityId, isPreview])

  const showHelperText = editingComment || replyingToComment

  const handleAddMention = useCallback((userId: ID) => {
    track(
      make({
        eventName: Name.COMMENTS_ADD_MENTION,
        userId
      })
    )
  }, [])

  const handleAddTimestamp = useCallback((timestamp: number) => {
    track(
      make({
        eventName: Name.COMMENTS_ADD_TIMESTAMP,
        timestamp
      })
    )
  }, [])

  const handleAddLink = useCallback(
    (entityId: ID, kind: 'track' | 'collection' | 'user') => {
      track(
        make({
          eventName: Name.COMMENTS_ADD_LINK,
          entityId,
          kind
        })
      )
    },
    []
  )

  return (
    <Flex direction='row' gap='m' alignItems='center'>
      {currentUserId ? (
        <Flex alignSelf='flex-start' pt='unit1' alignItems='center'>
          <ProfilePicture
            userId={currentUserId}
            style={{ width: 40, height: 40, flexShrink: 0 }}
          />
        </Flex>
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
            onFocus={handleFocus}
            isLoading={isLoading}
            messageId={messageId}
            entityId={entityId}
            presetMessage={initialMessage}
            placeholder={messages.addComment}
            onSubmit={handleSubmit}
            TextInputComponent={TextInputComponent}
            onLayout={handleLayout}
            maxLength={400}
            maxMentions={10}
            onAddMention={handleAddMention}
            onAddTimestamp={handleAddTimestamp}
            onAddLink={handleAddLink}
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
