import { useEffect, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { SquareSizes, Status } from '@audius/common/models'
import { Avatar, Flex, IconPin, Text, TextLink } from '@audius/harmony'
import { Comment } from '@audius/sdk'
import dayjs from 'dayjs'
import { usePrevious } from 'react-use'

import { UserLink } from 'components/link'
import { useProfilePicture } from 'hooks/useUserProfilePicture'

import { CommentActions } from './CommentActions'
import { CommentForm } from './CommentForm'

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
  parentCommentId?: string
}

export const CommentBlock = (props: CommentBlockProps) => {
  const { comment, parentCommentId } = props
  const {
    isPinned,
    message,
    timestampS,
    id: commentId,
    createdAt,
    userId: userIdStr
  } = comment

  const { usePostComment, useEditComment, useDeleteComment } =
    useCurrentCommentSection()

  const [editComment] = useEditComment()
  const [, { status: deleteStatus }] = useDeleteComment()
  const [isDeleting, setIsDeleting] = useState(false)
  const prevDeleteStatus = usePrevious(deleteStatus)
  useEffect(() => {
    if (prevDeleteStatus !== deleteStatus && deleteStatus !== Status.LOADING) {
      setIsDeleting(false)
    }
  }, [deleteStatus, prevDeleteStatus])

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
  const profileImage = useProfilePicture(userId, SquareSizes.SIZE_150_BY_150)

  const [showEditInput, setShowEditInput] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const hasBadges = false // TODO: need to figure out how to data model these "badges" correctly

  const handleCommentEdit = (commentMessage: string) => {
    setShowEditInput(false)
    editComment(commentId, commentMessage)
  }

  const handleCommentReply = (commentMessage: string) => {
    postComment(commentMessage, parentCommentId ?? comment.id)
  }

  return (
    <Flex w='100%' gap='l' css={{ opacity: isDeleting ? 0.5 : 1 }}>
      <Avatar
        css={{ width: 40, height: 40, flexShrink: 0 }}
        src={profileImage}
      />
      <Flex direction='column' gap='s' w='100%' alignItems='flex-start'>
        {isPinned || hasBadges ? (
          <Flex justifyContent='space-between' w='100%'>
            {isPinned ? (
              <Flex gap='xs'>
                <IconPin color='subdued' size='xs' />
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
          <UserLink userId={userId} disabled={isDeleting} />
          {/* TODO: figure out date from created_at */}
          <Flex gap='xs' alignItems='center' h='100%'>
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
        <CommentActions
          comment={comment}
          onClickReply={() => setShowReplyInput((prev) => !prev)}
          onClickEdit={() => setShowEditInput((prev) => !prev)}
          onClickDelete={() => setIsDeleting(true)}
          isDisabled={isDeleting}
        />

        {showReplyInput ? (
          <CommentForm
            onSubmit={handleCommentReply}
            isLoading={commentPostStatus === Status.LOADING}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
