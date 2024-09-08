import { useEffect, useMemo, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import {
  useCurrentCommentSection,
  useDeleteComment,
  usePostComment
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { Status } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { ArtistPick, Box, Flex, Text, Timestamp } from '@audius/harmony'
import { Comment, ReplyComment } from '@audius/sdk'
import { useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import { Avatar } from 'components/avatar'
import { UserLink } from 'components/link'
import { AppState } from 'store/types'

import { CommentActionBar } from './CommentActionBar'
import { CommentBadge } from './CommentBadge'
import { CommentForm } from './CommentForm'
import { TimestampLink } from './TimestampLink'
const { getUser } = cacheUsersSelectors

export type CommentBlockProps = {
  comment: Comment | ReplyComment
  parentCommentId?: string
  hideActions?: boolean
}

export const CommentBlock = (props: CommentBlockProps) => {
  const { comment, parentCommentId, hideActions } = props
  const {
    message,
    id: commentId,
    trackTimestampS,
    createdAt,
    userId: commentUserIdStr,
    isEdited
  } = comment
  const isPinned = 'isPinned' in comment ? comment.isPinned : false // pins dont exist on replies
  const createdAtDate = useMemo(() => new Date(createdAt), [createdAt])

  const commentUserId = Number(commentUserIdStr)

  const userHandle = useSelector(
    (state: AppState) => getUser(state, { id: commentUserId })?.handle
  )

  const { artistId } = useCurrentCommentSection()

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
  // triggers a fetch to get user profile info
  useGetUserById({ id: commentUserId }) // TODO: display a load state while fetching

  const [showEditInput, setShowEditInput] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const isCommentByArtist = commentUserId === artistId

  const isLikedByArtist = false // TODO: need to add this to backend metadata

  return (
    <Flex w='100%' gap='l' css={{ opacity: isDeleting ? 0.5 : 1 }}>
      <Box css={{ flexShrink: 0 }}>
        <Avatar
          userId={commentUserId}
          css={{ width: 44, height: 44 }}
          popover
        />
      </Box>
      <Flex direction='column' gap='s' w='100%' alignItems='flex-start'>
        <Box css={{ position: 'absolute', top: 0, right: 0 }}>
          <CommentBadge
            isArtist={isCommentByArtist}
            commentUserId={commentUserId}
          />
        </Box>
        {isPinned || isLikedByArtist ? (
          <Flex justifyContent='space-between' w='100%'>
            <ArtistPick isLiked={isLikedByArtist} isPinned={isPinned} />
          </Flex>
        ) : null}
        <Flex gap='s' alignItems='center'>
          <UserLink userId={commentUserId} disabled={isDeleting} popover />
          <Flex gap='xs' alignItems='flex-end' h='100%'>
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
          <Text variant='body' size='s' lineHeight='multi' textAlign='left'>
            {message}
            {isEdited ? (
              <Text color='subdued'> ({messages.edited})</Text>
            ) : null}
          </Text>
        )}
        {hideActions ? null : (
          <CommentActionBar
            comment={comment}
            onClickReply={() => setShowReplyInput((prev) => !prev)}
            onClickEdit={() => setShowEditInput((prev) => !prev)}
            onClickDelete={() => deleteComment(commentId)}
            isDisabled={isDeleting}
          />
        )}

        {showReplyInput ? (
          <CommentForm
            parentCommentId={parentCommentId ?? comment.id}
            initialValue={`@${userHandle}`}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
