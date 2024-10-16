import { useState } from 'react'

import { useGetCommentById, useGetCommentRepliesById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import type { Comment, ID, ReplyComment } from '@audius/common/models'

import {
  Box,
  Flex,
  IconCaretDown,
  IconCaretUp,
  PlainButton
} from '@audius/harmony-native'

import { CommentBlock } from './CommentBlock'

type CommentThreadProps = {
  commentId: ID
}

export const CommentThread = (props: CommentThreadProps) => {
  const { commentId } = props
  const { data: rootCommentData } = useGetCommentById(commentId)
  const rootComment = rootCommentData as Comment // We can safely assume that this is a parent comment

  const [hiddenReplies, setHiddenReplies] = useState<{
    [parentCommentId: number]: boolean
  }>({})

  const { currentUserId } = useCurrentCommentSection()
  const toggleReplies = (commentId: ID) => {
    const newHiddenReplies = { ...hiddenReplies }
    newHiddenReplies[commentId] = !newHiddenReplies[commentId]
    setHiddenReplies(newHiddenReplies)
  }
  const [hasRequestedMore, setHasRequestedMore] = useState(false)
  const { fetchNextPage: loadMoreReplies } = useGetCommentRepliesById({
    commentId,
    currentUserId,
    enabled: hasRequestedMore
  })

  const handleLoadMoreReplies = () => {
    if (hasRequestedMore) {
      loadMoreReplies()
    } else {
      // If hasLoadedMore is false, this is the first time the user is requesting more replies
      // In this case audius-query will automatically fetch the first page of replies, no need to trigger via loadMore()
      setHasRequestedMore(true)
    }
  }

  if (!rootComment || !('id' in rootComment)) return null

  const { replyCount } = rootComment

  const replies = rootComment.replies ?? []

  const hasMoreReplies = replyCount >= 3 && replies.length < replyCount // note: hasNextPage is undefined when inactive - have to explicitly check for false

  return (
    <>
      <CommentBlock commentId={rootComment.id} />
      <Flex pl={40} direction='column' mv='s' gap='s' alignItems='flex-start'>
        {(replies.length ?? 0) > 0 ? (
          <Box mv='xs'>
            <PlainButton
              onPress={() => toggleReplies(rootComment.id)}
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
        ) : null}
        {hiddenReplies[rootComment.id] ? null : (
          <>
            <Flex direction='column' gap='l'>
              {replies?.map((reply: ReplyComment) => (
                <Flex w='100%' key={reply.id}>
                  <CommentBlock
                    commentId={reply.id}
                    parentCommentId={rootComment.id}
                  />
                </Flex>
              ))}
            </Flex>

            {hasMoreReplies ? (
              <PlainButton onPress={handleLoadMoreReplies} variant='subdued'>
                {messages.showMoreReplies}
              </PlainButton>
            ) : null}
          </>
        )}
      </Flex>
    </>
  )
}
