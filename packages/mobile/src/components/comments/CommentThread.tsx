import { useState } from 'react'

import { useGetCommentById, useGetCommentRepliesById } from '@audius/common/api'
import { commentsMessages as messages } from '@audius/common/messages'
import type { ID, ReplyComment } from '@audius/common/models'

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
  const { data: rootComment } = useGetCommentById({
    id: commentId
  })

  const [hiddenReplies, setHiddenReplies] = useState<{
    [parentCommentId: number]: boolean
  }>({})

  const toggleReplies = (commentId: ID) => {
    const newHiddenReplies = { ...hiddenReplies }
    newHiddenReplies[commentId] = !newHiddenReplies[commentId]
    setHiddenReplies(newHiddenReplies)
  }
  const [hasLoadedMore, setHasLoadedMore] = useState(false)
  const {
    data: moreReplies,
    loadMore,
    hasMore
  } = useGetCommentRepliesById(
    { id: commentId },
    {
      // Root comments already have the first 3 replies so we only need to load more when the user requests them
      disabled: (rootComment?.replies?.length ?? 0) < 3 || !hasLoadedMore,
      pageSize: 3,
      // Start at the 4th reply
      startOffset: 3
    }
  )

  const hasMoreReplies = hasMore && (rootComment?.replies?.length ?? 0) >= 3

  const handleLoadMoreReplies = () => {
    if (hasLoadedMore) {
      loadMore()
    } else {
      // If hasLoadedMore is false, this is the first time the user is requesting more replies
      // In this case audius-query will automatically fetch the first page of replies, no need to trigger via loadMore()
      setHasLoadedMore(true)
    }
  }

  // Combine the replies from the root comment and the additional loaded replies
  const allReplies = [...(rootComment?.replies ?? []), ...(moreReplies ?? [])]

  if (!rootComment) return null

  const { replyCount } = rootComment

  return (
    <>
      <CommentBlock commentId={rootComment.id} />
      <Flex pl={40} direction='column' mv='s' gap='s' alignItems='flex-start'>
        {(allReplies.length ?? 0) > 0 ? (
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
              {allReplies?.map((reply: ReplyComment) => (
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
