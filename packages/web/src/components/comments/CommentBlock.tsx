import { useMemo, useState } from 'react'

import { useGetCommentById, useGetUserById } from '@audius/common/api'
import {
  useCurrentCommentSection,
  useDeleteComment
} from '@audius/common/context'
import { Comment, ID, ReplyComment } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { dayjs } from '@audius/common/utils'
import { Box, Flex, PlainButton, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { Avatar } from 'components/avatar'
import { UserLink } from 'components/link'
import { AppState } from 'store/types'

import { ArtistPick } from './ArtistPick'
import { CommentActionBar } from './CommentActionBar'
import { CommentBadge } from './CommentBadge'
import { CommentForm } from './CommentForm'
import { CommentText } from './CommentText'
import { Timestamp } from './Timestamp'
import { TimestampLink } from './TimestampLink'
const { getUser } = cacheUsersSelectors

export type CommentBlockProps = {
  commentId: ID
  parentCommentId?: ID
  isPreview?: boolean
}

const CommentBlockInternal = (
  props: Omit<CommentBlockProps, 'commentId'> & {
    comment: Comment | ReplyComment
  }
) => {
  const { comment, parentCommentId, isPreview } = props
  const { track, artistId } = useCurrentCommentSection()

  const {
    id: commentId,
    message,
    trackTimestampS,
    createdAt,
    userId,
    isEdited,
    isArtistReacted,
    mentions = []
  } = comment

  const isPinned = track.pinned_comment_id === commentId
  const isTombstone = 'isTombstone' in comment ? !!comment.isTombstone : false
  const createdAtDate = useMemo(
    () => dayjs.utc(createdAt).toDate(),
    [createdAt]
  )

  const userHandle = useSelector(
    (state: AppState) => getUser(state, { id: userId })?.handle
  )

  const [deleteComment] = useDeleteComment()

  // triggers a fetch to get user profile info
  useGetUserById({ id: userId }) // TODO: display a load state while fetching

  const [showEditInput, setShowEditInput] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const isCommentByArtist = userId === artistId

  return (
    <Flex w='100%' gap='l' css={{ opacity: isTombstone ? 0.5 : 1 }}>
      <Box css={{ flexShrink: 0, width: 44 }}>
        <Avatar userId={userId} size='medium' popover />
      </Box>
      <Flex direction='column' gap='s' w='100%' alignItems='flex-start'>
        <Box css={{ position: 'absolute', top: 0, right: 0 }}>
          {userId !== undefined ? (
            <CommentBadge isArtist={isCommentByArtist} commentUserId={userId} />
          ) : null}
        </Box>
        {isPinned || isArtistReacted ? (
          <Flex justifyContent='space-between' w='100%'>
            <ArtistPick isLiked={isArtistReacted} isPinned={isPinned} />
          </Flex>
        ) : null}
        {!isTombstone ? (
          <Flex gap='s' alignItems='center'>
            {userId !== undefined ? (
              <UserLink userId={userId} popover size='l' strength='strong' />
            ) : null}
            <Flex gap='xs' alignItems='flex-end' h='100%'>
              <Timestamp time={createdAtDate} />
              {trackTimestampS !== undefined ? (
                <>
                  <Text color='subdued' size='s'>
                    •
                  </Text>

                  <TimestampLink size='s' timestampSeconds={trackTimestampS} />
                </>
              ) : null}
            </Flex>
          </Flex>
        ) : null}
        {showEditInput ? (
          <Flex w='100%' direction='column' gap='s'>
            <CommentForm
              autoFocus
              onSubmit={() => setShowEditInput(false)}
              commentId={commentId}
              initialValue={message}
              initialUserMentions={mentions}
              isEdit
              hideAvatar
            />
            <PlainButton
              css={{ alignSelf: 'flex-end' }}
              onClick={() => setShowEditInput(false)}
            >
              Cancel
            </PlainButton>
          </Flex>
        ) : (
          <CommentText
            isEdited={isEdited && !isTombstone}
            isPreview={isPreview}
            mentions={mentions}
            commentId={commentId}
          >
            {message}
          </CommentText>
        )}
        {isPreview ? null : (
          <CommentActionBar
            comment={comment}
            onClickReply={() => setShowReplyInput((prev) => !prev)}
            onClickEdit={() => setShowEditInput((prev) => !prev)}
            onClickDelete={() => deleteComment(commentId, parentCommentId)}
            isDisabled={isTombstone || showReplyInput}
            hideReactCount={isTombstone}
            parentCommentId={parentCommentId}
          />
        )}

        {showReplyInput && userId !== undefined ? (
          <Flex w='100%' direction='column' gap='s'>
            <CommentForm
              autoFocus
              parentCommentId={parentCommentId ?? comment.id}
              initialValue={`@${userHandle} `}
              initialUserMentions={
                userHandle ? [{ userId, handle: userHandle }] : []
              }
              onSubmit={() => setShowReplyInput(false)}
            />
            <PlainButton
              css={{ alignSelf: 'flex-end' }}
              onClick={() => {
                setShowReplyInput(false)
              }}
            >
              Cancel
            </PlainButton>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}

// This is an extra component wrapper because the comment data coming back from tan-query could be undefined
// There's no way to return early in the above component due to rules of hooks ordering
export const CommentBlock = (props: CommentBlockProps) => {
  const { data: comment } = useGetCommentById(props.commentId)
  if (!comment || !('id' in comment)) return null
  return <CommentBlockInternal {...props} comment={comment} />
}
