import { useState } from 'react'

import { ID, SquareSizes } from '@audius/common/models'
import {
  Avatar,
  Flex,
  IconButton,
  IconHeart,
  IconMerch,
  IconPencil,
  IconTrash,
  Text,
  TextLink
} from '@audius/harmony'
import dayjs from 'dayjs'

import { UserLink } from 'components/link'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
import { decodeHashId } from 'utils/hashIds'

import { CommentForm } from './CommentForm'
import { useCurrentCommentSection } from './CommentSectionContext'
import type { Comment } from './types'

// TODO: move this somewhere else
// Format the date using the largest possible unit (y>mo>d>h>min)
const formatCommentDate = (dateStr: string) => {
  const now = dayjs()
  const commentDate = dayjs(dateStr)
  const diffInMinutes = Math.min(now.diff(commentDate, 'minute'), 1)
  const diffInHours = now.diff(commentDate, 'hour')
  const diffInDays = now.diff(commentDate, 'day')
  const diffInMonths = now.diff(commentDate, 'month')
  const diffInYears = now.diff(commentDate, 'year')

  if (diffInYears > 0) {
    return `${diffInYears}y`
  } else if (diffInMonths > 0) {
    return `${diffInMonths}mo`
  } else if (diffInDays > 0) {
    return `${diffInDays}d`
  } else if (diffInHours > 0) {
    return `${diffInHours}h`
  } else {
    return `${diffInMinutes}min`
  }
}

// TODO: move this somewhere else
// TODO: do we need hours?
const formatTrackTimestamp = (timestamp_s: number) => {
  const hours = Math.floor(timestamp_s / (60 * 60))
  const minutes = Math.floor(timestamp_s / 60)
  const seconds = `${timestamp_s % 60}`.padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${minutes}:${seconds}`
  } else {
    return `${minutes}:${seconds}`
  }
}

export type CommentBlockProps = {
  comment: Comment
  parentCommentId?: ID
  parentCommentIndex?: number
}

export const CommentBlock = (props: CommentBlockProps) => {
  const {
    comment,
    parentCommentId, // Parent comment ID & index will only exist on replies
    parentCommentIndex // Parent comment index helps quickly look up the parent comment
  } = props
  const {
    isPinned,
    message,
    reactCount = 0,
    timestampS,
    id: commentId,
    createdAt,
    userId: id
  } = comment
  const userId = Number(id)

  const profileImage = useProfilePicture(userId, SquareSizes.SIZE_150_BY_150)

  const {
    handleEditComment,
    handlePostComment,
    handleDeleteComment,
    handleReactComment,
    handlePinComment
  } = useCurrentCommentSection()

  const [showEditInput, setShowEditInput] = useState(false)
  const [reactionState, setReactionState] = useState(false)
  const hasBadges = false // TODO: need to figure out how to data model these "badges" correctly
  const [showReplyInput, setShowReplyInput] = useState(false)
  const isOwner = true // TODO: need to check against current user (not really feasible with modck data)

  const handleCommentEdit = (commentMessage: string) => {
    setShowEditInput(false)
    let decodedCommentId
    if (commentId) {
      decodedCommentId = decodeHashId(commentId.toString())
    }
    if (decodedCommentId) {
      handleEditComment(decodedCommentId, commentMessage)
    }
  }

  const handleCommentReply = (commentMessage: string) => {
    setShowReplyInput(false)
    let decodedParentCommentId
    if (parentCommentId) {
      decodedParentCommentId = decodeHashId(parentCommentId?.toString())
    }

    handlePostComment(
      commentMessage,
      decodedParentCommentId ?? undefined, // omitting null from the value type
      parentCommentIndex
    )
  }
  const handleCommentReact = () => {
    let decodedCommentId
    if (commentId) {
      decodedCommentId = decodeHashId(commentId.toString())
    }
    if (decodedCommentId) {
      setReactionState(!reactionState)
      handleReactComment(decodedCommentId, !reactionState)
    }
  }

  const handleCommentDelete = () => {
    let decodedCommentId
    if (commentId) {
      decodedCommentId = decodeHashId(commentId.toString())
    }
    if (decodedCommentId) {
      handleDeleteComment(decodedCommentId)
    }
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
        {/* TODO: this will be a user link but wont work with mock data */}
        <Flex gap='s' alignItems='center'>
          <UserLink userId={userId} />
          {/* TODO: figure out date from created_at */}
          <Flex gap='xs' alignItems='center'>
            {/* TODO: do we want this comment date changing on rerender? Or is that weird */}
            <Text size='s'> {formatCommentDate(createdAt)} </Text>
            {timestampS !== undefined ? (
              <>
                <Text color='subdued' size='xs'>
                  •
                </Text>

                <TextLink size='s' variant='active'>
                  {formatTrackTimestamp(timestampS)}
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
        <Flex gap='xl' alignItems='center'>
          <Flex alignItems='center'>
            <IconButton
              icon={IconHeart}
              color={reactionState ? 'active' : 'subdued'}
              aria-label='Heart comment'
              onClick={() => {
                handleCommentReact()
              }}
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
            <IconButton
              aria-label='delete comment'
              icon={IconTrash}
              size='s'
              color='subdued'
              onClick={() => {
                handleCommentDelete()
              }}
            />
          ) : null}
          {isOwner ? (
            <IconButton
              aria-label='pin comment'
              icon={IconMerch}
              size='s'
              color='subdued'
              onClick={() => {
                handlePinComment(commentId)
              }}
            />
          ) : null}
        </Flex>

        {showReplyInput ? <CommentForm onSubmit={handleCommentReply} /> : null}
      </Flex>
    </Flex>
  )
}
