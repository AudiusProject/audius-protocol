import { useEffect, useMemo, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { SquareSizes, Status } from '@audius/common/models'
import {
  Avatar,
  Flex,
  IconButton,
  IconHeart,
  IconMerch,
  IconPencil,
  IconTrash,
  LoadingSpinner,
  Text,
  TextLink,
  Timestamp
} from '@audius/harmony'
import { Comment } from '@audius/sdk'
import { usePrevious } from 'react-use'

import { UserLink } from 'components/link'
import { useProfilePicture } from 'hooks/useUserProfilePicture'

import { CommentForm } from './CommentForm'
import { TimestampLink } from './TimestampLink'

export type CommentBlockProps = {
  comment: Comment
  parentCommentId?: string
}

export const CommentBlock = (props: CommentBlockProps) => {
  const { comment, parentCommentId } = props
  const {
    isPinned,
    message,
    reactCount = 0,
    trackTimestampS,
    id: commentId,
    createdAt,
    userId: userIdStr
  } = comment
  const createdAtDate = useMemo(() => new Date(createdAt), [createdAt])

  const { usePostComment, useDeleteComment, useReactToComment, usePinComment } =
    useCurrentCommentSection()

  const [deleteComment, { status: deleteCommentStatus }] = useDeleteComment()
  const prevDeleteCommentStatus = usePrevious(deleteCommentStatus)
  const [reactToComment] = useReactToComment()
  const [pinComment] = usePinComment()
  const [, { status: commentPostStatus }] = usePostComment() // Note: comment post status is shared across all inputs they may have open
  const prevPostStatus = usePrevious(commentPostStatus)
  const [isDeleting, setIsDeleting] = useState(false)
  // wait for the comment to be posted before hiding the input
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
  const profileImage = useProfilePicture(userId, SquareSizes.SIZE_150_BY_150)

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
    <Flex w='100%' gap='l'>
      <Avatar
        css={{ width: 40, height: 40, flexShrink: 0 }}
        src={profileImage}
      />
      <Flex direction='column' gap='s' w='100%' alignItems='flex-start'>
        {isPinned || hasBadges ? (
          <Flex justifyContent='space-between' w='100%'>
            {isPinned ? (
              <Flex gap='xs'>
                <IconPencil color='subdued' size='xs' />
                <Text color='subdued' size='xs'>
                  Pinned by artist
                </Text>
              </Flex>
            ) : null}
            {hasBadges ? <Text color='accent'>Top Supporter</Text> : null}
          </Flex>
        ) : null}
        <Flex gap='s' alignItems='center'>
          <UserLink userId={userId} />
          <Flex gap='xs' alignItems='center' h='100%'>
            <Timestamp time={createdAtDate} />
            {trackTimestampS !== undefined ? (
              <>
                <Text color='subdued' size='xs'>
                  •
                </Text>

                <TimestampLink trackTimestampS={trackTimestampS} />
              </>
            ) : null}
          </Flex>
        </Flex>
        {showEditInput ? (
          <CommentForm
            onSubmit={() => {
              setShowEditInput(false)
            }}
            commentId={commentId}
            initialValue={message}
            isEdit
            hideAvatar
          />
        ) : (
          <Text color='default'>{message}</Text>
        )}
        <Flex gap='xl' alignItems='center'>
          <Flex alignItems='center'>
            <IconButton
              icon={IconHeart}
              color={reactionState ? 'active' : 'subdued'}
              aria-label='Heart comment'
              onClick={handleCommentReact}
            />
            <Text color='default'> {reactCount}</Text>
          </Flex>
          <TextLink
            variant='subdued'
            onClick={() => {
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
              onClick={() => {
                setShowEditInput((prevVal) => !prevVal)
              }}
            />
          ) : null}
          {/* TODO: rework this - this is a temporary design: just to have buttons for triggering stuff */}
          {isOwner ? (
            isDeleting ? (
              <LoadingSpinner css={{ width: 16, height: 16 }} />
            ) : (
              <IconButton
                aria-label='delete comment'
                icon={IconTrash}
                size='s'
                color='subdued'
                onClick={handleCommentDelete}
              />
            )
          ) : null}
          {isOwner ? (
            <IconButton
              aria-label='pin comment'
              icon={IconMerch}
              size='s'
              color='subdued'
              onClick={handleCommentPin}
            />
          ) : null}
        </Flex>

        {showReplyInput ? (
          <CommentForm parentCommentId={parentCommentId ?? comment.id} />
        ) : null}
      </Flex>
    </Flex>
  )
}
