import { useState } from 'react'

import { useGetCommentById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import type { ReplyComment } from '@audius/sdk'

import {
  Box,
  Flex,
  IconCaretDown,
  IconCaretUp,
  PlainButton,
  Text
} from '@audius/harmony-native'

import { CommentBlock } from './CommentBlock'

const messages = {
  showMoreReplies: 'Show More Replies'
}

export const CommentThread = ({ commentId }: { commentId: string }) => {
  const { data: rootComment } = useGetCommentById({
    id: commentId
  })
  const { handleLoadMoreReplies } = useCurrentCommentSection()
  // TODO: this feels sub-optimal? Maybe fine
  const [hiddenReplies, setHiddenReplies] = useState<{
    [parentCommentId: number]: boolean
  }>({})

  const toggleReplies = (commentId: string) => {
    const newHiddenReplies = { ...hiddenReplies }
    newHiddenReplies[commentId] = !newHiddenReplies[commentId]
    setHiddenReplies(newHiddenReplies)
  }

  if (!rootComment) return null

  return (
    <>
      <CommentBlock comment={rootComment} />
      <Flex pl={40} direction='column' mv='s' gap='s' alignItems='flex-start'>
        {(rootComment?.replies?.length ?? 0) > 0 ? (
          <Box mv='xs'>
            <PlainButton
              onPress={() => toggleReplies(rootComment.id)}
              variant='subdued'
              iconLeft={
                hiddenReplies[rootComment.id] ? IconCaretDown : IconCaretUp
              }
            >
              {hiddenReplies[rootComment.id] ? 'Show Replies' : 'Hide Replies'}
            </PlainButton>
          </Box>
        ) : null}
        {hiddenReplies[rootComment.id] ? null : (
          <>
            <Flex direction='column' gap='l'>
              {rootComment?.replies?.map((reply: ReplyComment) => (
                <Flex w='100%' key={reply.id}>
                  <CommentBlock
                    comment={reply}
                    parentCommentId={rootComment.id}
                  />
                </Flex>
              ))}
            </Flex>

            {(rootComment?.replies?.length ?? 0) > 0 ? (
              <Box mv='xs'>
                <PlainButton
                  variant='subdued'
                  onPress={() => handleLoadMoreReplies(rootComment.id)}
                >
                  {messages.showMoreReplies}
                </PlainButton>
              </Box>
            ) : null}
          </>
        )}
      </Flex>
    </>
  )
}
