import { useCallback, useState } from 'react'

import { useGetCommentById, useUserComments } from '@audius/common/api'
import { Comment } from '@audius/common/models'
import { useTrack } from '@audius/common/src/api/tan-query/useTrack'
import { useUser } from '@audius/common/src/api/tan-query/useUser'
import {
  Flex,
  IconMessage,
  Divider,
  Text,
  PlainButton,
  IconArrowRight,
  Skeleton,
  useTheme,
  Box
} from '@audius/harmony'
import { OptionalHashId } from '@audius/sdk'
import { useDispatch } from 'react-redux'

import { TrackLink } from 'components/link'
import { push } from 'utils/navigation'
import { fullCommentHistoryPage } from 'utils/route'

import { ProfilePageNavSectionItem } from './ProfilePageNavSectionItem'
import { ProfilePageNavSectionTitle } from './ProfilePageNavSectionTitle'

const messages = {
  recentComments: 'Recent Comments',
  viewAll: 'View All'
}

const CommentListItem = ({ id }: { id: number }) => {
  const dispatch = useDispatch()
  const { data } = useGetCommentById(id)
  const theme = useTheme()
  const comment = data as Comment | undefined
  const [isHovered, setIsHovered] = useState(false)
  const { data: track } = useTrack(OptionalHashId.parse(comment?.entityId), {
    enabled: !!comment?.entityId
  })

  if (!comment) return null

  const handleClick = () => {
    if (track) {
      dispatch(push(track.permalink))
    }
  }

  return (
    <Flex
      column
      gap='m'
      w='100%'
      css={{ cursor: 'pointer' }}
      onClick={handleClick}
      onMouseLeave={() => setIsHovered(false)}
      onMouseEnter={() => setIsHovered(true)}
    >
      <Flex column gap='2xs' w='100%'>
        {track ? (
          <TrackLink
            size='s'
            variant='subdued'
            showUnderline={isHovered}
            trackId={track?.track_id}
            ellipses
          />
        ) : (
          <Skeleton w='80%' h={theme.typography.lineHeight.m} />
        )}

        <Text variant='body' size='s' ellipses>
          {comment.message}
        </Text>
      </Flex>
      <Divider orientation='horizontal' />
    </Flex>
  )
}

export const RecentComments = ({ userId }: { userId: number }) => {
  const dispatch = useDispatch()
  const { data: user } = useUser(userId)
  const { data: commentIds = [] } = useUserComments({ userId, pageSize: 3 })
  const onClickViewAll = useCallback(() => {
    if (user?.handle) {
      dispatch(push(fullCommentHistoryPage(user.handle)))
    }
  }, [dispatch, user?.handle])

  if (commentIds.length === 0) return null

  return (
    <ProfilePageNavSectionItem>
      <ProfilePageNavSectionTitle
        title={messages.recentComments}
        Icon={IconMessage}
      />
      <Flex
        alignItems='flex-start'
        w='100%'
        column
        gap='m'
        borderRadius='m'
        shadow='mid'
        p='l'
        backgroundColor='surface1'
      >
        {commentIds.map((id) => (
          <CommentListItem key={id} id={id} />
        ))}
        <Box w='100%' onClick={onClickViewAll}>
          <PlainButton variant='subdued' iconRight={IconArrowRight}>
            {messages.viewAll}
          </PlainButton>
        </Box>
      </Flex>
    </ProfilePageNavSectionItem>
  )
}
