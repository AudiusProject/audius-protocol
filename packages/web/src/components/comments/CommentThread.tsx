import { useState } from 'react'

import { useGetCommentById } from '@audius/common/api'
import { useCurrentCommentSection } from '@audius/common/context'
import { Flex, IconCaretDown, IconCaretUp, TextLink } from '@audius/harmony'
import { ReplyComment } from '@audius/sdk'

import { CommentBlock } from './CommentBlock'

const messages = {
  showMoreReplies: 'Show More Replies'
}

export const CommentThread = ({ commentId }: { commentId: string }) => {
  const { data: rootComment } = useGetCommentById({
    id: commentId
  })
  const { handleLoadMoreReplies } = useCurrentCommentSection()
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
    <Flex direction='column'>
      <CommentBlock comment={rootComment} />
      <Flex ml='56px' direction='column' mt='l' gap='l'>
        {(rootComment?.replies?.length ?? 0) > 0 ? (
          <TextLink onClick={() => toggleReplies(rootComment.id)}>
            {hiddenReplies[rootComment.id] ? (
              <IconCaretUp color='subdued' size='m' />
            ) : (
              <IconCaretDown color='subdued' size='m' />
            )}
            {hiddenReplies[rootComment.id] ? 'Show' : 'Hide'} Replies
          </TextLink>
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
        {/* TODO: need a way to hide this when no more to load */}
        {(rootComment?.replies?.length ?? 0) > 0 ? (
          <TextLink onClick={() => handleLoadMoreReplies(rootComment.id)}>
            {messages.showMoreReplies}
          </TextLink>
        ) : null}
      </Flex>
    </Flex>
  )
}
