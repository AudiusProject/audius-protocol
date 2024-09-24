import { useGetCommentById, useGetUserById } from '@audius/common/api'
import {
  useCommentPostStatus,
  useCurrentCommentSection
} from '@audius/common/context'
import { Status } from '@audius/common/models'
import type { Comment, ReplyComment } from '@audius/sdk'
import { css } from '@emotion/native'

import {
  ArtistPick,
  Box,
  CommentText,
  Flex,
  Text,
  TextLink,
  Timestamp
} from '@audius/harmony-native'
import { formatCommentTrackTimestamp } from 'app/utils/comments'

import { ProfilePicture } from '../core/ProfilePicture'
import { UserLink } from '../user-link'

import { CommentActionBar } from './CommentActionBar'
import { CommentBadge } from './CommentBadge'

export type CommentBlockProps = {
  commentId: string
  parentCommentId?: string
  hideActions?: boolean
}

export const CommentBlockInternal = (
  props: Omit<CommentBlockProps, 'commentId'> & {
    comment: Comment | ReplyComment
  }
) => {
  const { comment, hideActions } = props
  const { artistId } = useCurrentCommentSection()
  const {
    message,
    trackTimestampS,
    createdAt,
    userId: commentUserIdStr,
    isEdited,
    isArtistReacted
  } = comment
  const isTombstone = 'isTombstone' in comment ? !!comment.isTombstone : false
  const isPinned = 'isPinned' in comment ? comment.isPinned : false // pins dont exist on replies

  const commentPostStatus = useCommentPostStatus(comment)
  const isLoading = commentPostStatus === Status.LOADING

  const commentUserId = Number(commentUserIdStr)
  useGetUserById({ id: commentUserId })

  const isCommentByArtist = commentUserId === artistId

  return (
    <Flex
      direction='row'
      w='100%'
      gap='s'
      style={css({ opacity: isTombstone ? 0.5 : 1 })}
    >
      <ProfilePicture
        style={{ width: 32, height: 32, flexShrink: 0 }}
        userId={commentUserId}
      />
      <Flex gap='xs' w='100%' alignItems='flex-start' style={{ flexShrink: 1 }}>
        <Box style={{ position: 'absolute', top: 0, right: 0 }}>
          <CommentBadge
            isArtist={isCommentByArtist}
            commentUserId={commentUserId}
          />
        </Box>
        {isPinned || isArtistReacted ? (
          <Flex direction='row' justifyContent='space-between' w='100%'>
            <ArtistPick isLiked={isArtistReacted} isPinned={isPinned} />
          </Flex>
        ) : null}
        {!isTombstone ? (
          <Flex direction='row' gap='s' alignItems='center'>
            <UserLink size='s' userId={commentUserId} strength='strong' />
            <Flex direction='row' gap='xs' alignItems='center' h='100%'>
              <Timestamp time={new Date(createdAt)} />
              {trackTimestampS !== undefined ? (
                <>
                  <Text color='subdued' size='xs'>
                    •
                  </Text>

                  <TextLink
                    size='xs'
                    variant='active'
                    onPress={() => {
                      // TODO
                    }}
                  >
                    {formatCommentTrackTimestamp(trackTimestampS)}
                  </TextLink>
                </>
              ) : null}
            </Flex>
          </Flex>
        ) : null}
        <CommentText isEdited={isEdited}>{message}</CommentText>
        {!hideActions ? (
          <CommentActionBar
            comment={comment}
            isDisabled={isLoading || isTombstone}
            hideReactCount={isTombstone}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}

// This is an extra component wrapper because the comment data coming back from aquery could be undefined
// There's no way to return early in the above component due to rules of hooks ordering
export const CommentBlock = (props: CommentBlockProps) => {
  const { data: comment } = useGetCommentById({ id: props.commentId })
  if (!comment) return null
  return <CommentBlockInternal {...props} comment={comment} />
}
