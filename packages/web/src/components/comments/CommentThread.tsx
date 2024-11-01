import { useState } from 'react'

import { useGetCommentById, useGetCommentRepliesById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { Comment, ID, Name, ReplyComment } from '@audius/common/models'
import {
  Box,
  Flex,
  IconCaretDown,
  IconCaretUp,
  LoadingSpinner,
  PlainButton
} from '@audius/harmony'

import { track, make } from 'services/analytics'

import { CommentBlock } from './CommentBlock'

export const CommentThread = ({ commentId }: { commentId: ID }) => {
  const { data: rootCommentData } = useGetCommentById(commentId)
  const rootComment = rootCommentData as Comment // We can safely assume that this is a parent comment

  const { currentUserId, entityId } = useCurrentCommentSection()
  const [hasRequestedMore, setHasRequestedMore] = useState(false)
  const { fetchNextPage: loadMoreReplies, isFetching: isFetchingReplies } =
    useGetCommentRepliesById({
      commentId,
      currentUserId,
      enabled: hasRequestedMore
    })

  const [hiddenReplies, setHiddenReplies] = useState<{
    [parentCommentId: string]: boolean
  }>({})

  const toggleReplies = (commentId: ID) => {
    const newHiddenReplies = { ...hiddenReplies }
    newHiddenReplies[commentId] = !newHiddenReplies[commentId]
    setHiddenReplies(newHiddenReplies)

    track(
      make({
        eventName: newHiddenReplies[commentId]
          ? Name.COMMENTS_HIDE_REPLIES
          : Name.COMMENTS_SHOW_REPLIES,
        commentId,
        trackId: entityId
      })
    )
  }

  const handleLoadMoreReplies = () => {
    if (hasRequestedMore) {
      loadMoreReplies()

      track(
        make({
          eventName: Name.COMMENTS_LOAD_MORE_REPLIES,
          commentId,
          trackId: entityId
        })
      )
    } else {
      // Since we have
      setHasRequestedMore(true)
    }
  }

  // Combine the replies from the root comment and the additional loaded replies

  if (!rootComment) return null

  const { replyCount } = rootComment

  const hasReplies = replyCount > 0

  const replies = rootComment.replies ?? []

  const hasMoreReplies = replyCount >= 3 && replies.length < replyCount // note: hasNextPage is undefined when inactive - have to explicitly check for false

  return (
    <Flex direction='column' as='li'>
      <CommentBlock commentId={rootComment.id} />
      {hasReplies ? (
        <Flex ml='56px' direction='column' mt='l' gap='l'>
          <Box alignSelf='flex-start'>
            <PlainButton
              onClick={() => toggleReplies(rootComment.id)}
              variant='subdued'
              iconLeft={
                hiddenReplies[rootComment.id] ? IconCaretDown : IconCaretUp
              }
            >
              {hiddenReplies[rootComment.id]
                ? messages.showReplies(replyCount)
                : messages.hideReplies}
            </PlainButton>
          </Box>
          <Box
            css={{
              display: 'grid',
              gridTemplateRows: hiddenReplies[rootComment.id] ? '0fr' : '1fr',
              transition: 'grid-template-rows 0.25s ease-out'
            }}
          >
            <Flex direction='column' gap='l' css={{ overflow: 'hidden' }}>
              <Flex
                direction='column'
                gap='l'
                as='ul'
                aria-label={messages.replies}
              >
                {replies.map((reply: ReplyComment) => (
                  <Flex w='100%' key={reply.id} as='li'>
                    <CommentBlock
                      commentId={reply.id}
                      parentCommentId={rootComment.id}
                    />
                  </Flex>
                ))}
              </Flex>

              {hasMoreReplies ? (
                <PlainButton
                  onClick={handleLoadMoreReplies}
                  variant='subdued'
                  css={{ width: 'max-content' }}
                  disabled={isFetchingReplies}
                >
                  {messages.showMoreReplies}
                  {isFetchingReplies ? (
                    <LoadingSpinner css={{ width: 20, height: 20 }} />
                  ) : null}
                </PlainButton>
              ) : null}
            </Flex>
          </Box>
        </Flex>
      ) : null}
    </Flex>
  )
}
