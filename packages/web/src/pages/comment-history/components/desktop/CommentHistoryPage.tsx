import { useCallback, useMemo, useRef } from 'react'

import {
  useGetCommentById,
  useGetCommentsByUserId,
  useGetCurrentUserId,
  useGetTrackById,
  useGetUserByHandle,
  useGetUserById
} from '@audius/common/api'
import { Status } from '@audius/common/models'
import {
  Box,
  Flex,
  IconButton,
  IconHeart,
  LoadingSpinner,
  Paper,
  Skeleton,
  Text,
  TextLink
} from '@audius/harmony'
import { Comment, decodeHashId } from '@audius/sdk'
import dayjs from 'dayjs'
import InfiniteScroll from 'react-infinite-scroller'
import { useNavigate } from 'react-router-dom-v5-compat'

import { Avatar } from 'components/avatar'
import { CommentBlockSkeletons } from 'components/comments/CommentSkeletons'
import { Timestamp } from 'components/comments/Timestamp'
import { Header } from 'components/header/desktop/Header'
import { TrackLink, UserLink } from 'components/link'
import Page from 'components/page/Page'
import { useProfileParams } from 'pages/profile-page/useProfileParams'
import { fullCommentHistoryPage } from 'utils/route'

import { CommentText } from './CommentText'

const messages = {
  by: ' by ',
  noComments: 'No comments',
  view: 'View'
}

const UserComment = ({ commentId }: { commentId: number }) => {
  const res = useGetCommentById(commentId)
  const comment = res.data as Comment
  const navigate = useNavigate()

  const {
    id,
    entityId,
    message,
    createdAt,
    userId,
    isEdited,
    mentions = [],
    reactCount,
    isCurrentUserReacted
  } = comment

  // @ts-expect-error - the id is a number
  const { status } = useGetUserById({ id: userId })
  const { data: track } = useGetTrackById({ id: decodeHashId(entityId) })
  const isLoadingUser = status === Status.LOADING
  const createdAtDate = useMemo(
    () => dayjs.utc(createdAt).toDate(),
    [createdAt]
  )

  const goToTrackPage = useCallback(() => {
    if (track) {
      navigate(track.permalink)
    }
  }, [track, navigate])

  if (!comment) return null

  return (
    <Flex w='100%' gap='l' pv='m'>
      <Box>
        {/* @ts-expect-error - the id is a number */}
        <Avatar userId={userId} size='medium' popover alignSelf='flex-start' />
      </Box>
      <Flex column w='100%' gap='s' alignItems='flex-start'>
        <Flex column gap='xs' w='100%'>
          <Flex>
            <Text variant='body' size='s'>
              {track ? (
                <>
                  <TrackLink isActive trackId={track?.track_id} />
                  {messages.by}
                  <UserLink isActive userId={track?.owner_id} />
                </>
              ) : (
                <Skeleton w={180} h={20} />
              )}
            </Text>
          </Flex>
          <Flex column>
            <Flex justifyContent='space-between'>
              <Flex gap='s' alignItems='center'>
                {isLoadingUser ? <Skeleton w={80} h={18} /> : null}
                {userId !== undefined ? (
                  <UserLink
                    // @ts-expect-error - the id is a number
                    userId={userId}
                    popover
                    size='l'
                    strength='strong'
                  />
                ) : null}
                <Flex gap='xs' alignItems='flex-end' h='100%'>
                  <Timestamp time={createdAtDate} />
                </Flex>
              </Flex>
            </Flex>
            <CommentText
              isEdited={isEdited}
              isPreview={false}
              mentions={mentions}
              // @ts-expect-error - the id is a number
              commentId={id}
            >
              {message}
            </CommentText>
          </Flex>
        </Flex>
        <Flex gap='l' alignItems='center'>
          <Flex alignItems='center' gap='xs'>
            <IconButton
              icon={IconHeart}
              color={isCurrentUserReacted ? 'active' : 'subdued'}
              aria-label='Heart comment'
              onClick={goToTrackPage}
            />
            <Text> {reactCount || ''}</Text>
          </Flex>
          <TextLink variant='subdued' onClick={goToTrackPage}>
            {messages.view}
          </TextLink>
        </Flex>
      </Flex>
    </Flex>
  )
}

export type CommentHistoryPageProps = {
  title: string
}

export const CommentHistoryPage = ({ title }: CommentHistoryPageProps) => {
  const profileParams = useProfileParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: user } = useGetUserByHandle({
    handle: profileParams?.handle ?? '',
    currentUserId
  })

  const {
    data: commentIds,
    hasNextPage,
    fetchNextPage,
    isLoading,
    isFetchingNextPage
  } = useGetCommentsByUserId({
    userId: user?.user_id ?? 0,
    currentUserId
  })

  const renderHeader = () => <Header showBackButton primary={title} />
  const getScrollParent = useCallback(() => containerRef.current ?? null, [])

  const handleLoadMore = useCallback(() => {
    fetchNextPage()
    // TODO: Track Event here?
  }, [fetchNextPage])

  return (
    <Page
      containerRef={containerRef}
      title={title}
      description={`Comment History${user?.name ? ` for ${user.name}` : ''}`}
      canonicalUrl={user ? fullCommentHistoryPage(user.handle) : ''}
      header={renderHeader()}
    >
      <Paper>
        <InfiniteScroll
          hasMore={hasNextPage}
          loadMore={handleLoadMore}
          getScrollParent={getScrollParent}
          useWindow={false}
          style={{ width: '100%' }}
          threshold={-250}
        >
          <Flex direction='column' p='xl' pt='l'>
            {isLoading ? (
              <CommentBlockSkeletons />
            ) : (
              <>
                {commentIds.length === 0 ? (
                  <Text>{messages.noComments}</Text>
                ) : (
                  commentIds.map((id) => (
                    <UserComment key={id} commentId={id} />
                  ))
                )}
                {isFetchingNextPage ? (
                  <Flex justifyContent='center' mt='l'>
                    <LoadingSpinner css={{ width: 20, height: 20 }} />
                  </Flex>
                ) : null}
              </>
            )}
          </Flex>
        </InfiniteScroll>
      </Paper>
    </Page>
  )
}
