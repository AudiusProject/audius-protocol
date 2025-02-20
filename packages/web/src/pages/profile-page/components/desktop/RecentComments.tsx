import { useCallback } from 'react'

import { useGetCommentById, useGetCommentsByUserId } from '@audius/common/api'
import { useUser } from '@audius/common/src/api/tan-query/useUser'
import {
  Flex,
  IconMessage,
  Divider,
  Text,
  PlainButton,
  IconArrowRight
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'
import { userCommentsPage } from 'utils/route'

import { ProfilePageNavSectionItem } from './ProfilePageNavSectionItem'
import { ProfilePageNavSectionTitle } from './ProfilePageNavSectionTitle'

const messages = {
  recentComments: 'Recent Comments',
  viewAll: 'View All'
}

const CommentListItem = ({ id }: { id: number }) => {
  const { data: comment } = useGetCommentById(id)
  if (!comment || !('message' in comment)) return null

  // TODO-NOW: Update to new comment reponse so we can get trackId

  return (
    <Flex column gap='m' w='100%'>
      <Flex column gap='2xs' w='100%'>
        <Text variant='body' size='s' color='subdued'>
          Title
        </Text>
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
  const { data: commentIds = [] } = useGetCommentsByUserId({
    userId,
    pageSize: 3
  })

  const onClickViewAll = useCallback(() => {
    if (user?.handle) {
      dispatch(push(userCommentsPage(user.handle)))
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
