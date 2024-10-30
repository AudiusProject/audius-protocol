import { useCallback, useEffect } from 'react'

import { useGetCommentById, useGetUserById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import {
  Name,
  type Comment,
  type ID,
  type ReplyComment,
  Status
} from '@audius/common/models'
import { dayjs } from '@audius/common/utils'
import { css } from '@emotion/native'
import { useLinkProps } from '@react-navigation/native'
import type { GestureResponderEvent } from 'react-native'
import { Animated, TouchableOpacity } from 'react-native'

import { Box, Flex, Text } from '@audius/harmony-native'
import { make, track as trackEvent } from 'app/services/analytics'

import { ProfilePicture } from '../core/ProfilePicture'
import { Skeleton } from '../skeleton'
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
  isPreview?: boolean
}

export const CommentBlockInternal = (
  props: Omit<CommentBlockProps, 'commentId'> & {
    comment: Comment | ReplyComment
  }
) => {
  const { comment, isPreview, parentCommentId } = props
  const { artistId, track, closeDrawer } = useCurrentCommentSection()
  const {
    id: commentId,
    message,
    mentions = [],
    trackTimestampS,
    createdAt,
    userId,
    isEdited,
    isArtistReacted
  } = comment
  const isTombstone = 'isTombstone' in comment ? !!comment.isTombstone : false
  const isPinned = track.pinned_comment_id === commentId

  const { status } = useGetUserById({ id: userId })
  const isLoadingUser = status === Status.LOADING
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

  const handlePressTimestamp = useCallback(
    (e: GestureResponderEvent, timestampSeconds: number) => {
      trackEvent(
        make({
          eventName: Name.COMMENTS_CLICK_TIMESTAMP,
          commentId,
          timestamp: timestampSeconds
        })
      )
    },
    [commentId]
  )

  const isCommentByArtist = userId === artistId

  // Add fade animation and run on mount
  const fadeAnim = new Animated.Value(0)

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
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
          {isLoadingUser ? (
            <Skeleton
              width={32}
              height={32}
              style={{ borderRadius: 100, flexShrink: 0 }}
            />
          ) : (
            <ProfilePicture
              style={{ width: 32, height: 32, flexShrink: 0 }}
              userId={userId}
            />
          )}
        </TouchableOpacity>
        <Flex
          gap='xs'
          w='100%'
          alignItems='flex-start'
          style={{ flexShrink: 1 }}
        >
          <Box style={{ position: 'absolute', top: 0, right: 0 }}>
            {userId !== undefined ? (
              <CommentBadge
                isArtist={isCommentByArtist}
                commentUserId={userId}
              />
            ) : null}
          </Box>
          {isPinned || isArtistReacted ? (
            <Flex direction='row' justifyContent='space-between' w='100%'>
              <ArtistPick isLiked={isArtistReacted} isPinned={isPinned} />
            </Flex>
          ) : null}
          {!isTombstone ? (
            <Flex direction='row' gap='s' alignItems='center' w='65%'>
              {isLoadingUser ? <Skeleton width={80} height={18} /> : null}
              {userId !== undefined && !isLoadingUser ? (
                <UserLink
                  userId={userId}
                  strength='strong'
                  onPress={closeDrawer}
                  lineHeight='single'
                  textLinkStyle={{ lineHeight: 20 }}
                />
              ) : null}
              <Flex direction='row' gap='xs' alignItems='center' h='100%'>
                <Timestamp time={dayjs.utc(createdAt).toDate()} />
                {trackTimestampS !== undefined ? (
                  <>
                    <Text color='subdued' size='s'>
                      •
                    </Text>

                    <TimestampLink
                      size='s'
                      timestampSeconds={trackTimestampS}
                      onPress={handlePressTimestamp}
                    />
                  </>
                ) : null}
              </Flex>
            </Flex>
          ) : null}
          <CommentText
            isEdited={isEdited && !isTombstone}
            isPreview={isPreview}
            commentId={commentId}
            mentions={mentions}
          >
            {message}
          </CommentText>
          {!isPreview ? (
            <CommentActionBar
              comment={comment}
              isDisabled={isTombstone}
              hideReactCount={isTombstone}
              parentCommentId={parentCommentId}
            />
          ) : null}
        </Flex>
      </Flex>
    </Animated.View>
  )
}

// This is an extra component wrapper because the comment data coming back from aquery could be undefined
// There's no way to return early in the above component due to rules of hooks ordering
export const CommentBlock = (props: CommentBlockProps) => {
  const { data: comment } = useGetCommentById(props.commentId)
  if (!comment || !('id' in comment)) return null
  return <CommentBlockInternal {...props} comment={comment} />
}
