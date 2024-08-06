import { useState } from 'react'

import { ID } from '@audius/common/models'
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

import { decodeHashId } from 'utils/hashIds'

import { CommentForm } from './CommentForm'
import { useCurrentCommentSection } from './CommentSectionContext'
import type { Comment } from './types'

// TODO: do we need hours?
const formatTimestampS = (timestamp_s: number) => {
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
    is_pinned: isPinned,
    message,
    react_count: reactCount,
    timestamp_s,
    id: commentId
  } = comment
  const {
    handleEditComment,
    handlePostComment,
    handleDeleteComment,
    handleReactComment,
    handlePinComment
  } = useCurrentCommentSection()

  const [showEditInput, setShowEditInput] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)

  const hasBadges = false // TODO: need to figure out how to data model these "badges" correctly
  const isOwner = true // TODO: need to check against current user (not really feasible with modck data)

  const handleEditFormSubmit = (commentMessage: string) => {
    setShowEditInput(false)
    handleEditComment(commentId, commentMessage)
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

  return (
    <Flex w='100%' gap='l'>
      <Avatar css={{ width: 40, height: 40, flexShrink: 0 }} />
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
          <Text color='default'>Display Name</Text>
          {/* TODO: figure out date from created_at */}
          <Flex gap='xs' alignItems='center'>
            <Text size='s'> 2d </Text>
            {timestamp_s !== undefined ? (
              <>
                <Text color='subdued' size='xs'>
                  •
                </Text>

                <TextLink size='s' variant='active'>
                  {formatTimestampS(timestamp_s)}
                </TextLink>
              </>
            ) : null}
          </Flex>
        </Flex>
        {showEditInput ? (
          <CommentForm
            onSubmit={handleEditFormSubmit}
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
              color='subdued'
              aria-label='Heart comment'
              onClick={() => {
                handleReactComment(commentId)
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
                handleDeleteComment(commentId)
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
