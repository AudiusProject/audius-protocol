import { useEffect, useMemo, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import {
  useCurrentCommentSection,
  useDeleteComment
} from '@audius/common/context'
import { SquareSizes, Status } from '@audius/common/models'
import { Avatar, Flex, IconPin, Text, Timestamp } from '@audius/harmony'
import { Comment } from '@audius/sdk'
import { usePrevious } from 'react-use'

import { UserLink } from 'components/link'
import { useProfilePicture } from 'hooks/useUserProfilePicture'

import { CommentActionBar } from './CommentActionBar'
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
    id: commentId,
    trackTimestampS,
    createdAt,
    userId: userIdStr
  } = comment
  const createdAtDate = useMemo(() => new Date(createdAt), [createdAt])

  const { usePostComment } = useCurrentCommentSection()

  const [deleteComment, { status: deleteStatus }] = useDeleteComment()

  const [, { status: commentPostStatus }] = usePostComment() // Note: comment post status is shared across all inputs they may have open
  const prevPostStatus = usePrevious(commentPostStatus)
  const isDeleting = deleteStatus === Status.LOADING
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
  const [showReplyInput, setShowReplyInput] = useState(false)
  const hasBadges = false // TODO: need to figure out how to data model these "badges" correctly

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
        <Flex gap='s' alignItems='center'>
          <UserLink userId={userId} disabled={isDeleting} />
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
        <CommentActionBar
          comment={comment}
          onClickReply={() => setShowReplyInput((prev) => !prev)}
          onClickEdit={() => setShowEditInput((prev) => !prev)}
          onClickDelete={() => deleteComment(commentId)}
          isDisabled={isDeleting}
        />

        {showReplyInput ? (
          <CommentForm parentCommentId={parentCommentId ?? comment.id} />
        ) : null}
      </Flex>
    </Flex>
  )
}
