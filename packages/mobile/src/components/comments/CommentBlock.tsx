import { useEffect, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { Status } from '@audius/common/models'
import type { Comment } from '@audius/sdk'
import { usePrevious } from 'react-use'

import {
  Flex,
  IconButton,
  IconHeart,
  IconPencil,
  Text,
  TextLink
} from '@audius/harmony-native'
import {
  formatCommentDate,
  formatCommentTrackTimestamp
} from 'app/utils/comments'

import { ProfilePicture } from '../core/ProfilePicture'
import { UserLink } from '../user-link'

import { CommentForm } from './CommentForm'

export type CommentBlockProps = {
  comment: Comment
  parentCommentId?: string
  hideActions?: boolean
}

export const CommentBlock = (props: CommentBlockProps) => {
  const { comment, parentCommentId, hideActions } = props
  const {
    isPinned,
    message,
    reactCount = 0,
    timestampS,
    id: commentId,
    createdAt,
    userId: userIdStr
  } = comment

  const {
    usePostComment,
    useEditComment,
    useDeleteComment,
    useReactToComment,
    usePinComment
  } = useCurrentCommentSection()

  const [editComment] = useEditComment()
  const [deleteComment, { status: deleteCommentStatus }] = useDeleteComment()
  const prevDeleteCommentStatus = usePrevious(deleteCommentStatus)
  const [reactToComment] = useReactToComment()
  const [pinComment] = usePinComment()
  // Note: comment post status is shared across all inputs they may have open
  const [postComment, { status: commentPostStatus }] = usePostComment()
  const prevPostStatus = usePrevious(commentPostStatus)
  const [isDeleting, setIsDeleting] = useState(false)
  useEffect(() => {
    if (
      prevPostStatus !== commentPostStatus &&
      commentPostStatus === Status.SUCCESS
    ) {
      setShowReplyInput(false)
    }
  }, [commentPostStatus, prevPostStatus])
  const userId = Number(userIdStr)
  useGetUserById({ id: userId })

  const [showEditInput, setShowEditInput] = useState(false)
  const [reactionState, setReactionState] = useState(false) // TODO: need to pull starting value from metadata
  const [showReplyInput, setShowReplyInput] = useState(false)
  const isOwner = true // TODO: need to check against current user (not really feasible with modck data)
  const hasBadges = false // TODO: need to figure out how to data model these "badges" correctly

  useEffect(() => {
    if (
      isDeleting &&
      (deleteCommentStatus === Status.SUCCESS ||
        deleteCommentStatus === Status.ERROR) &&
      prevDeleteCommentStatus !== deleteCommentStatus
    ) {
      setIsDeleting(false)
    }
  }, [isDeleting, deleteCommentStatus, prevDeleteCommentStatus])

  const handleCommentEdit = (commentMessage: string) => {
    setShowEditInput(false)
    editComment(commentId, commentMessage)
  }

  const handleCommentReply = (commentMessage: string) => {
    postComment(commentMessage, parentCommentId ?? comment.id)
  }

  const handleCommentReact = () => {
    setReactionState(!reactionState)
    reactToComment(commentId, !reactionState)
  }

  const handleCommentDelete = () => {
    setIsDeleting(true)
    deleteComment(commentId)
  }

  const handleCommentPin = () => {
    pinComment(commentId)
  }

  return (
    <Flex direction='row' w='100%' gap='l'>
      <ProfilePicture
        style={{ width: 40, height: 40, flexShrink: 0 }}
        userId={userId}
      />
      <Flex gap='s' w='100%' alignItems='flex-start'>
        {isPinned || hasBadges ? (
          <Flex direction='row' justifyContent='space-between' w='100%'>
            {isPinned ? (
              <Flex direction='row' gap='xs'>
                <IconPencil color='subdued' size='xs' />
                <Text color='subdued' size='xs'>
                  Pinned by artist
                </Text>
              </Flex>
            ) : null}
            {hasBadges ? <Text color='accent'>Top Supporter</Text> : null}
          </Flex>
        ) : null}
        {/* TODO: this will be a user link but wont work with mock data */}
        <Flex direction='row' gap='s' alignItems='center'>
          <UserLink userId={userId} />
          {/* TODO: figure out date from created_at */}
          <Flex direction='row' gap='xs' alignItems='center' h='100%'>
            {/* TODO: do we want this comment date changing on rerender? Or is that weird */}
            <Text size='s'> {formatCommentDate(createdAt)} </Text>
            {timestampS !== undefined ? (
              <>
                <Text color='subdued' size='xs'>
                  •
                </Text>

                <TextLink size='s' variant='active'>
                  {formatCommentTrackTimestamp(timestampS)}
                </TextLink>
              </>
            ) : null}
          </Flex>
        </Flex>
        {showEditInput ? (
          <CommentForm
            onSubmit={handleCommentEdit}
            initialValue={message}
            hideAvatar
          />
        ) : (
          <Text color='default'>{message}</Text>
        )}

        {!hideActions ? (
          <>
            <Flex direction='row' gap='xl' alignItems='center'>
              <Flex direction='row' alignItems='center'>
                <IconButton
                  icon={IconHeart}
                  color={reactionState ? 'active' : 'subdued'}
                  aria-label='Heart comment'
                  onPress={handleCommentReact}
                />
                <Text color='default'> {reactCount}</Text>
              </Flex>
              <TextLink
                variant='subdued'
                onPress={() => {
                  setShowReplyInput(!showReplyInput)
                }}
              >
                Reply
              </TextLink>
              {/* TODO: rework this - this is a temporary design: just to have buttons for triggering stuff */}
              {/* TODO: this needs to convert to a text input to work */}
              {isOwner ? (
                <IconButton
                  aria-label='edit comment'
                  icon={IconPencil}
                  size='s'
                  color='subdued'
                  onPress={() => {
                    setShowEditInput((prevVal) => !prevVal)
                  }}
                />
              ) : null}
            </Flex>

            {showReplyInput ? (
              <CommentForm
                onSubmit={handleCommentReply}
                isLoading={commentPostStatus === Status.LOADING}
              />
            ) : null}
          </>
        ) : null}
      </Flex>
    </Flex>
  )
}
