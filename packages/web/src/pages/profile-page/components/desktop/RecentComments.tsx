import { useCallback } from 'react'

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
  useTheme
} from '@audius/harmony'
import { OptionalHashId } from '@audius/sdk'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'
import { fullCommentHistoryPage } from 'utils/route'

import { ProfilePageNavSectionItem } from './ProfilePageNavSectionItem'
import { ProfilePageNavSectionTitle } from './ProfilePageNavSectionTitle'

const messages = {
  recentComments: 'Recent Comments',
  viewAll: 'View All'
}

const CommentListItem = ({ id }: { id: number }) => {
  const { data } = useGetCommentById(id)
  const theme = useTheme()
  const comment = data as Comment | undefined
  const { data: track } = useTrack(OptionalHashId.parse(comment?.entityId), {
    enabled: !!comment?.entityId
  })

  if (!comment) return null

  return (
    <Flex column gap='m' w='100%'>
      <Flex column gap='2xs' w='100%'>
        {track ? (
          <Text variant='body' size='s' color='subdued'>
            {track.title}
          </Text>
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
  const { data: commentIds = [] } = useUserComments(userId, 3)
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
        p='m'
        backgroundColor='surface1'
      >
        {commentIds.map((id) => (
          <CommentListItem key={id} id={id} />
        ))}
        <PlainButton
          variant='subdued'
          iconRight={IconArrowRight}
          onClick={onClickViewAll}
        >
          {messages.viewAll}
        </PlainButton>
      </Flex>
    </ProfilePageNavSectionItem>
  )
}
