import { useState } from 'react'

import { useGetCommentById } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { Flex, IconCaretDown, IconCaretUp, TextLink } from '@audius/harmony'

import { CommentBlock } from './CommentBlock'
import { useCurrentCommentSection } from './CommentSectionContext'

const messages = {
  showMoreReplies: 'Show More Replies'
}

export const CommentThread = ({ commentId }: { commentId: ID }) => {
  const { data: rootComment } = useGetCommentById({
    id: commentId
  })
  const { handleLoadMoreReplies } = useCurrentCommentSection()
  // TODO: this feels sub-optimal? Maybe fine
  const [hiddenReplies, setHiddenReplies] = useState<{
    [parentCommentId: number]: boolean
  }>({})

  const toggleReplies = (commentId: ID) => {
    const newHiddenReplies = { ...hiddenReplies }
    newHiddenReplies[commentId] = !newHiddenReplies[commentId]
    setHiddenReplies(newHiddenReplies)
  }

  return (
    <Flex direction='column'>
      <CommentBlock comment={rootComment} />
      <Flex ml='56px' direction='column' mt='l'>
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
          <Flex direction='column' mt='l' gap='l'>
            {rootComment?.replies?.map((reply) => (
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
