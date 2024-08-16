import { useEffect, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { Status } from '@audius/common/models'
import type { Comment } from '@audius/sdk'
import { usePrevious } from 'react-use'

import {
  CommentText,
  Flex,
  IconButton,
  IconHeart,
  IconKebabHorizontal,
  IconPencil,
  Text,
  TextLink,
  Timestamp
} from '@audius/harmony-native'
import { formatCommentTrackTimestamp } from 'app/utils/comments'

import { ProfilePicture } from '../core/ProfilePicture'
import { UserLink } from '../user-link'

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

  const { usePostComment, useEditComment, useReactToComment } =
    useCurrentCommentSection()

  const [editComment] = useEditComment()
  const [reactToComment] = useReactToComment()
  // Note: comment post status is shared across all inputs they may have open
  const [postComment, { status: commentPostStatus }] = usePostComment()
  const prevPostStatus = usePrevious(commentPostStatus)
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

  const [reactionState, setReactionState] = useState(false) // TODO: need to pull starting value from metadata
  const [showReplyInput, setShowReplyInput] = useState(false)
  const isOwner = true // TODO: need to check against current user (not really feasible with modck data)
  const hasBadges = false // TODO: need to figure out how to data model these "badges" correctly

  const handleCommentEdit = (commentMessage: string) => {
    editComment(commentId, commentMessage)
  }

  const handleCommentReply = (commentMessage: string) => {
    postComment(commentMessage, parentCommentId ?? comment.id)
  }

  const handleCommentReact = () => {
    setReactionState(!reactionState)
    reactToComment(commentId, !reactionState)
  }

  return (
    <Flex direction='row' w='100%' gap='s'>
      <ProfilePicture
        style={{ width: 32, height: 32, flexShrink: 0 }}
        userId={userId}
      />
      <Flex gap='xs' w='100%' alignItems='flex-start'>
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
        <Flex direction='row' gap='s' alignItems='center'>
          <UserLink size='s' userId={userId} />
          <Flex direction='row' gap='xs' alignItems='center' h='100%'>
            <Timestamp time={new Date(createdAt)} />
            {timestampS !== undefined ? (
              <>
                <Text color='subdued' size='xs'>
                  •
                </Text>

                <TextLink size='xs' variant='active'>
                  {formatCommentTrackTimestamp(timestampS)}
                </TextLink>
              </>
            ) : null}
          </Flex>
        </Flex>
        <CommentText>{message}</CommentText>

        {!hideActions ? (
          <>
            <Flex direction='row' gap='l' alignItems='center'>
              <Flex direction='row' alignItems='center'>
                <IconButton
                  size='m'
                  icon={IconHeart}
                  color={reactionState ? 'active' : 'subdued'}
                  aria-label='Heart comment'
                  onPress={handleCommentReact}
                />
                <Text color='default' size='s'>
                  {' '}
                  {reactCount}
                </Text>
              </Flex>
              <TextLink
                variant='subdued'
                size='s'
                onPress={() => {
                  setShowReplyInput(!showReplyInput)
                }}
              >
                Reply
              </TextLink>
              <IconButton
                aria-label='edit comment'
                icon={IconKebabHorizontal}
                size='s'
                color='subdued'
                onPress={() => {}}
              />
            </Flex>
          </>
        ) : null}
      </Flex>
    </Flex>
  )
}
