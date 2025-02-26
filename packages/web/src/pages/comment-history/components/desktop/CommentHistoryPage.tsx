import { useCallback, useMemo } from 'react'

import {
  useGetCommentById,
  useTrack,
  useUser,
  useUserByParams,
  useUserComments
} from '@audius/common/api'
import { Comment } from '@audius/common/models'
import { profilePage } from '@audius/common/src/utils/route'
import {
  Box,
  Button,
  Flex,
  IconButton,
  IconHeart,
  IconMessage,
  LoadingSpinner,
  Paper,
  Skeleton,
  Text,
  TextLink
} from '@audius/harmony'
import { HashId } from '@audius/sdk'
import dayjs from 'dayjs'
import InfiniteScroll from 'react-infinite-scroller'
import { useNavigate } from 'react-router-dom-v5-compat'

import { Avatar } from 'components/avatar'
import { CommentBlockSkeletons } from 'components/comments/CommentSkeletons'
import { Timestamp } from 'components/comments/Timestamp'
import { Header } from 'components/header/desktop/Header'
import { TrackLink, UserLink } from 'components/link'
import Page from 'components/page/Page'
import { useMainContentRef } from 'pages/MainContentContext'
import { useProfileParams } from 'pages/profile-page/useProfileParams'
import { fullCommentHistoryPage } from 'utils/route'

import { CommentText } from './CommentText'

const messages = {
  description: (userName: string | null) =>
    `Comment History${userName ? ` for ${userName}` : ''}`,
  by: ' by ',
  view: 'View',
  nothingToDisplay: 'Nothing to Display',
  noComments: "This user hasn't left any comments yet!",
  backToProfile: 'Back To Profile'
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

  const { isPending: isUserPending } = useUser(userId)
  const { data: track } = useTrack(HashId.parse(entityId))
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
    <Flex w='100%' gap='l'>
      <Box>
        <Avatar userId={userId} size='medium' popover alignSelf='flex-start' />
      </Box>
      <Flex column w='100%' gap='s' alignItems='flex-start'>
        <Flex column gap='xs' w='100%'>
          <Flex>
            <Text variant='body' size='s' textAlign='left'>
              {track ? (
                <>
                  <TrackLink isActive trackId={track?.track_id} />
                  <Text>{messages.by}</Text>
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
                {isUserPending ? <Skeleton w={80} h={18} /> : null}
                {userId !== undefined ? (
                  <UserLink
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
              commentId={id}
            >
              {message}
            </CommentText>
          </Flex>
        </Flex>
        <Flex gap='l' alignItems='center' onClick={goToTrackPage}>
          {reactCount > 0 ? (
            <Flex alignItems='center' gap='xs'>
              <IconButton
                icon={IconHeart}
                color={isCurrentUserReacted ? 'active' : 'subdued'}
                aria-label='Heart comment'
                css={{ pointerEvents: 'none' }}
              />
              <Text> {reactCount || ''}</Text>
            </Flex>
          ) : null}
          <TextLink variant='subdued'>{messages.view}</TextLink>
        </Flex>
      </Flex>
    </Flex>
  )
}

const NoComments = ({ handle }: { handle?: string }) => {
  const navigate = useNavigate()

  const goToProfile = useCallback(() => {
    if (handle) {
      navigate(profilePage(handle))
    }
  }, [handle, navigate])

  return (
    <Flex column gap='2xl' p='l'>
      <Flex column alignItems='center' gap='l'>
        <IconMessage size='3xl' color='subdued' />
        <Text variant='heading' size='s'>
          {messages.nothingToDisplay}
        </Text>
        <Text variant='body' size='l'>
          {messages.noComments}
        </Text>
      </Flex>
      <Box>
        <Button variant='secondary' size='small' onClick={goToProfile}>
          {messages.backToProfile}
        </Button>
      </Box>
    </Flex>
  )
}

export type CommentHistoryPageProps = {
  title: string
}

export const CommentHistoryPage = ({ title }: CommentHistoryPageProps) => {
  const profileParams = useProfileParams()
  const containerRef = useMainContentRef()
  const { data: user } = useUserByParams(profileParams ?? {})

  const {
    data: commentIds,
    hasNextPage,
    fetchNextPage,
    isPending,
    isFetchingNextPage
  } = useUserComments({ userId: user?.user_id ?? null })

  const renderHeader = () => <Header showBackButton primary={title} />
  const getScrollParent = useCallback(
    () => containerRef.current ?? null,
    [containerRef]
  )

  const handleLoadMore = useCallback(() => {
    fetchNextPage()
    // TODO: Track Event here?
  }, [fetchNextPage])

  return (
    <Page
      title={title}
      description={messages.description(user?.name ?? null)}
      canonicalUrl={user ? fullCommentHistoryPage(user.handle) : ''}
      header={renderHeader()}
    >
      <Paper>
        <InfiniteScroll
          hasMore={hasNextPage}
          loadMore={handleLoadMore}
          getScrollParent={getScrollParent}
          useWindow={false}
          css={{ width: '100%' }}
          threshold={250}
        >
          <Flex direction='column' p='xl' gap='l'>
            {isPending ? (
              <CommentBlockSkeletons />
            ) : (
              <>
                {commentIds.length === 0 ? (
                  <NoComments handle={user?.handle} />
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
