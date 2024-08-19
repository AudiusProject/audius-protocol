import { useState } from 'react'

import { useGetCommentById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import type { ReplyComment } from '@audius/sdk'
import { TouchableOpacity } from 'react-native-gesture-handler'

import { Flex, IconCaretDown, IconCaretUp, Text } from '@audius/harmony-native'

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
      <Flex pl={40} direction='column' mv='s' gap='s'>
        {(rootComment?.replies?.length ?? 0) > 0 ? (
          <TouchableOpacity onPress={() => toggleReplies(rootComment.id)}>
            <Flex direction='row' gap='s' alignItems='center'>
              {hiddenReplies[rootComment.id] ? (
                <IconCaretUp color='subdued' size='s' />
              ) : (
                <IconCaretDown color='subdued' size='s' />
              )}
              <Text variant='title' size='s' color='subdued'>
                {hiddenReplies[rootComment.id] ? 'Show' : 'Hide'} Replies
              </Text>
            </Flex>
          </TouchableOpacity>
        ) : null}
        {hiddenReplies[rootComment.id] ? null : (
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
        )}
        {(rootComment?.replies?.length ?? 0) > 0 ? (
          <TouchableOpacity
            onPress={() => handleLoadMoreReplies(rootComment.id)}
          >
            <Text variant='title' size='s' color='subdued'>
              {messages.showMoreReplies}
            </Text>
          </TouchableOpacity>
        ) : null}
      </Flex>
    </>
  )
}
