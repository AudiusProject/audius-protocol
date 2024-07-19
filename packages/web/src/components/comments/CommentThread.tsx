import { useState } from 'react'

import { ID } from '@audius/common/models'
import { Flex, IconCaretDown, IconCaretUp, TextLink } from '@audius/harmony'

import { CommentBlock } from './CommentBlock'
import { useCurrentCommentSection } from './CommentSectionContext'

export const CommentThread = () => {
  const { comments } = useCurrentCommentSection()
  // TODO: this feels sub-optimal? Maybe fine
  const [hiddenReplies, setHiddenReplies] = useState<{
    [parentCommendId: number]: boolean
  }>({})

  const toggleReplies = (commentId: ID) => {
    const newHiddenReplies = { ...hiddenReplies }
    newHiddenReplies[commentId] = !newHiddenReplies[commentId]
    setHiddenReplies(newHiddenReplies)
  }

  return (
    <Flex direction='column' gap='m'>
      {comments.map((rootComment) => (
        <Flex key={rootComment.id} direction='column'>
          <CommentBlock comment={rootComment} />
          {rootComment?.replies?.map((reply) => (
            <Flex ml='56px' key={reply.id} direction='column' gap='l' mt='l'>
              <TextLink onClick={() => toggleReplies(rootComment.id)}>
                {hiddenReplies[rootComment.id] ? (
                  <IconCaretUp color='subdued' size='m' />
                ) : (
                  <IconCaretDown color='subdued' size='m' />
                )}
                {hiddenReplies[rootComment.id] ? 'Show' : 'Hide'} Replies
              </TextLink>
              <Flex w='100%'>
                {hiddenReplies[rootComment.id] ? null : (
                  <CommentBlock
                    // TODO: fix type
                    comment={reply}
                    parentCommentId={rootComment.id}
                  />
                )}
              </Flex>
            </Flex>
          ))}
        </Flex>
      ))}
    </Flex>
  )
}
