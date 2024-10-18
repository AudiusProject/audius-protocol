import { useCallback } from 'react'

import { useGetCommentById, useGetUserById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import type { Comment, ID, ReplyComment } from '@audius/common/models'
import { dayjs } from '@audius/common/utils'
import { css } from '@emotion/native'
import { Link, useLinkProps, useLinkTo } from '@react-navigation/native'
import { TouchableOpacity } from 'react-native'

import { Box, Flex, Text } from '@audius/harmony-native'

import { ProfilePicture } from '../core/ProfilePicture'
import { UserLink } from '../user-link'

import { ArtistPick } from './ArtistPick'
import { CommentActionBar } from './CommentActionBar'
import { CommentBadge } from './CommentBadge'
import { CommentText } from './CommentText'
import { Timestamp } from './Timestamp'
import { TimestampLink } from './TimestampLink'

export type CommentBlockProps = {
  commentId: ID
  parentCommentId?: ID
  hideActions?: boolean
}

export const CommentBlockInternal = (
  props: Omit<CommentBlockProps, 'commentId'> & {
    comment: Comment | ReplyComment
  }
) => {
  const { comment, hideActions, parentCommentId } = props
  const { artistId, track, closeDrawer } = useCurrentCommentSection()
  const {
    id: commentId,
    message,
    trackTimestampS,
    createdAt,
    userId,
    isEdited,
    isArtistReacted
  } = comment
  const isTombstone = 'isTombstone' in comment ? !!comment.isTombstone : false
  const isPinned = track.pinned_comment_id === commentId

  useGetUserById({ id: userId })
  const { onPress: onPressProfilePic, ...profilePicLinkProps } = useLinkProps({
    to: {
      screen: 'Profile',
      params: { id: userId }
    }
  })

  const handlePressProfilePic = useCallback(() => {
    closeDrawer?.()
    onPressProfilePic()
  }, [closeDrawer, onPressProfilePic])

  const isCommentByArtist = userId === artistId

  return (
    <Flex
      direction='row'
      w='100%'
      gap='s'
      style={css({ opacity: isTombstone ? 0.5 : 1 })}
    >
      <TouchableOpacity
        {...profilePicLinkProps}
        onPress={handlePressProfilePic}
      >
        <ProfilePicture
          style={{ width: 32, height: 32, flexShrink: 0 }}
          userId={userId}
        />
      </TouchableOpacity>
      <Flex gap='xs' w='100%' alignItems='flex-start' style={{ flexShrink: 1 }}>
        <Box style={{ position: 'absolute', top: 0, right: 0 }}>
          <CommentBadge isArtist={isCommentByArtist} commentUserId={userId} />
        </Box>
        {isPinned || isArtistReacted ? (
          <Flex direction='row' justifyContent='space-between' w='100%'>
            <ArtistPick isLiked={isArtistReacted} isPinned={isPinned} />
          </Flex>
        ) : null}
        {!isTombstone ? (
          <Flex direction='row' gap='s' alignItems='center'>
            <UserLink
              size='s'
              userId={userId}
              strength='strong'
              onPress={closeDrawer}
            />
            <Flex direction='row' gap='xs' alignItems='center' h='100%'>
              <Timestamp time={dayjs.utc(createdAt).toDate()} />
              {trackTimestampS !== undefined ? (
                <>
                  <Text color='subdued' size='xs'>
                    •
                  </Text>

                  <TimestampLink timestampSeconds={trackTimestampS} size='xs' />
                </>
              ) : null}
            </Flex>
          </Flex>
        ) : null}
        <CommentText isEdited={isEdited}>{message}</CommentText>
        {!hideActions ? (
          <CommentActionBar
            comment={comment}
            isDisabled={isTombstone}
            hideReactCount={isTombstone}
            parentCommentId={parentCommentId}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}

// This is an extra component wrapper because the comment data coming back from aquery could be undefined
// There's no way to return early in the above component due to rules of hooks ordering
export const CommentBlock = (props: CommentBlockProps) => {
  const { data: comment } = useGetCommentById(props.commentId)
  if (!comment || !('id' in comment)) return null
  return <CommentBlockInternal {...props} comment={comment} />
}
