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
import { animated, useSpring, useTrail } from '@react-spring/web'
import { useDispatch } from 'react-redux'

import { TrackLink } from 'components/link'
import { push } from 'utils/navigation'
import { fullCommentHistoryPage } from 'utils/route'

import { ProfilePageNavSectionItem } from './ProfilePageNavSectionItem'
import { ProfilePageNavSectionTitle } from './ProfilePageNavSectionTitle'

const AnimatedFlex = animated(Flex)
const AnimatedBox = animated(Box)

const messages = {
  recentComments: 'Recent Comments',
  viewAll: 'View All'
}

const CommentListItem = ({ id, style }: { id: number; style?: object }) => {
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
    <AnimatedFlex
      style={style}
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
    </AnimatedFlex>
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

  const { spring } = useTheme()

  // Main container animation - fade in and expand from top
  const containerSpring = useSpring({
    from: { opacity: 0, height: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, height: 'auto', transform: 'translateY(0)' },
    config: spring.standard
  })

  // Trail animation for comment items - staggered fade in
  const trail = useTrail(commentIds.length, {
    from: { opacity: 0, transform: 'translateY(-10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: spring.fast
  })

  // View all button animation
  const viewAllSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(-5px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: spring.standard,
    delay: 300 // Delay even more to appear after comments
  })

  if (commentIds.length === 0) return null

  return (
    <ProfilePageNavSectionItem>
      <ProfilePageNavSectionTitle
        title={messages.recentComments}
        Icon={IconMessage}
      />
      <AnimatedFlex
        style={containerSpring}
        alignItems='flex-start'
        w='100%'
        column
        gap='m'
        borderRadius='m'
        shadow='mid'
        p='m'
        backgroundColor='surface1'
      >
        {trail.map((style, index) => (
          <CommentListItem
            key={commentIds[index]}
            id={commentIds[index]}
            style={style}
          />
        ))}
        <AnimatedBox style={viewAllSpring} w='100%' onClick={onClickViewAll}>
          <PlainButton variant='subdued' iconRight={IconArrowRight}>
            {messages.viewAll}
          </PlainButton>
        </AnimatedBox>
      </AnimatedFlex>
    </ProfilePageNavSectionItem>
  )
}
