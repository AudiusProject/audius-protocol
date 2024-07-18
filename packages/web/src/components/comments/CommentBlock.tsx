import { useState } from 'react'

import { ID } from '@audius/common/models'
import {
  Avatar,
  Flex,
  IconButton,
  IconHeart,
  IconPencil,
  IconTrash,
  Text,
  TextLink
} from '@audius/harmony'

import { CommentInputForm } from './CommentInputForm'
import type { Comment } from './types'

export type CommentBlockProps = { comment: Comment; parentCommentId?: ID }
export const CommentBlock = ({ comment }: { comment: Comment }) => {
  const { is_pinned: isPinned, message, react_count: reactCount } = comment
  const hasBadges = false // TODO: need to figure out how to model "badges" correctly
  const [showReplyInput, setShowReplyInput] = useState(false)
  const isOwner = true // TODO: need to check against current user (annoying to do with modck data)
  return (
    <Flex w='100%' gap='l'>
      <Avatar css={{ width: 40, height: 40, flexShrink: 0 }} />
      <Flex direction='column' gap='s' w='100%' alignItems='flex-start'>
        {isPinned || hasBadges ? (
          <Flex justifyContent='space-between' w='100%'>
            {isPinned ? (
              <Flex gap='xs'>
                <IconPencil color='subdued' size='xs' />
                <Text color='subdued' size='xs'>
                  Pinned by artist
                </Text>
              </Flex>
            ) : null}
            {hasBadges ? <Text color='accent'>Top Supporter</Text> : null}
          </Flex>
        ) : null}
        {/* TODO: this will be a user link but wont work with mock data */}
        <Flex gap='s' alignItems='flex-end'>
          <Text color='default'>Display Name</Text>
          {/* TODO: figure out date from created_at */}
          <Flex gap='xs' alignItems='center'>
            <Text size='s'> 2d </Text>
            {/* TODO: determine timestamp from data */}
            <Text color='subdued' size='xs'>
              •
            </Text>
            <TextLink size='s' variant='active'>
              1:32
            </TextLink>
          </Flex>
        </Flex>
        <Text color='default'>{message}</Text>
        <Flex gap='xl' alignItems='center'>
          <Flex alignItems='center'>
            <IconButton
              icon={IconHeart}
              color='subdued'
              aria-label='Heart comment'
            />
            <Text color='default'> {reactCount}</Text>
          </Flex>
          <TextLink
            variant='subdued'
            onClick={() => {
              setShowReplyInput(!showReplyInput)
            }}
          >
            {' '}
            Reply
          </TextLink>
          {/* TODO: rework this - this is a temporary design: just to have buttons for triggering stuff */}
          {/* TODO: wire this up to a callback */}
          {isOwner ? (
            <IconButton
              aria-label='edit comment'
              icon={IconPencil}
              size='s'
              color='subdued'
            />
          ) : null}
          {/* TODO: rework this - this is a temporary design: just to have buttons for triggering stuff */}
          {/* TODO: wire this up to callback */}
          {isOwner ? (
            <IconButton
              aria-label='delete comment'
              icon={IconTrash}
              size='s'
              color='subdued'
            />
          ) : null}
        </Flex>

        {showReplyInput ? (
          <CommentInputForm parentCommentId={parentCommentId} />
        ) : null}
      </Flex>
    </Flex>
  )
}
