import { useState } from 'react'

import { useGetCommentById, useGetCommentRepliesById } from '@audius/common/api'
import { useAllPaginatedQuery } from '@audius/common/audius-query'
import {
  Divider,
  Flex,
  IconCaretDown,
  IconCaretUp,
  TextLink
} from '@audius/harmony'
import { ReplyComment } from '@audius/sdk'

import { CommentBlock } from './CommentBlock'

const COMMENT_THREAD_PAGE_SIZE = 3

const messages = {
  showMoreReplies: 'Show More Replies'
}

export const CommentThread = ({ commentId }: { commentId: string }) => {
  const { data: rootComment } = useGetCommentById({
    id: commentId
  })
  // const { data: replies, loadMore } = useAllPaginatedQuery(
  //   // @ts-ignore
  //   useGetCommentRepliesById,
  //   { id: commentId },
  //   { pageSize: COMMENT_THREAD_PAGE_SIZE, disabled: true }
  // )

  const [hiddenReplies, setHiddenReplies] = useState<{
    [parentCommentId: string]: boolean
  }>({})

  const toggleReplies = (commentId: string) => {
    const newHiddenReplies = { ...hiddenReplies }
    newHiddenReplies[commentId] = !newHiddenReplies[commentId]
    setHiddenReplies(newHiddenReplies)
  }

  if (!rootComment) return null

  return (
    <Flex direction='column' as='li'>
      <CommentBlock comment={rootComment} />
      <Flex ml='56px' direction='column' mt='l' gap='l'>
        {(rootComment?.replies?.length ?? 0) > 0 ? (
          <Box alignSelf='flex-start'>
            <PlainButton
              onClick={() => toggleReplies(rootComment.id)}
              variant='subdued'
              iconLeft={
                hiddenReplies[rootComment.id] ? IconCaretDown : IconCaretUp
              }
            >
              {hiddenReplies[rootComment.id]
                ? messages.showReplies
                : messages.hideReplies}
            </PlainButton>
          </Box>
        ) : null}
        {hiddenReplies[rootComment.id] ? null : (
          <Flex
            direction='column'
            gap='l'
            as='ul'
            aria-label={messages.replies}
          >
            {rootComment?.replies?.map((reply: ReplyComment) => (
              <Flex w='100%' key={reply.id} as='li'>
                <CommentBlock
                  comment={reply}
                  parentCommentId={rootComment.id}
                />
              </Flex>
            ))}
          </Flex>
        )}
        {/* TODO: need a way to hide this when no more to load */}
        {(rootComment?.replies?.length ?? 0) > 0 ? (
          <TextLink>{messages.showMoreReplies}</TextLink>
        ) : null}
      </Flex>
    </Flex>
  )
}
