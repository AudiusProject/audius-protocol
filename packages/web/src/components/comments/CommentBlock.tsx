import { useState } from 'react'

import { ID } from '@audius/common/models'
import {
  Avatar,
  Flex,
  IconButton,
  IconHeart,
  IconPencil,
  IconTrash,
  Text,
  TextLink
} from '@audius/harmony'

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
    // TODO: check designs- I think we want a m:ss format regardless
    return `${minutes}:${seconds}`
  }
}

export type CommentBlockProps = {
  comment: Comment
  parentCommentId?: ID
  parentCommentIndex?: number
}

export const CommentBlock = ({
  comment,
  parentCommentId, // Parent comment ID can be passed in order to reply to a reply, otherwise it's assumed you're replying to this comment
  parentCommentIndex
}: CommentBlockProps) => {
  const {
    is_pinned: isPinned,
    message,
    react_count: reactCount,
    timestamp_s,
    id: commentId
  } = comment
  const { handleDeleteComment, handleReactComment } = useCurrentCommentSection()
  const hasBadges = false // TODO: need to figure out how to data model these "badges" correctly
  const [showReplyInput, setShowReplyInput] = useState(false)
  const isOwner = true // TODO: need to check against current user (not really feasible with modck data)

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
        <Text color='default'>{message}</Text>
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
        </Flex>

        {showReplyInput ? (
          <CommentForm
            parentCommentId={parentCommentId ?? commentId}
            parentCommentIndex={parentCommentIndex}
            onPostComment={() => {
              setShowReplyInput(false)
            }}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
