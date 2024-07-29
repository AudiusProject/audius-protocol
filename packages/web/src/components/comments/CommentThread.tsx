import { useState } from 'react'

import { ID } from '@audius/common/models'
import {
  Flex,
  IconCaretDown,
  IconCaretUp,
  Text,
  TextLink
} from '@audius/harmony'

import { CommentBlock } from './CommentBlock'
import { useCurrentCommentSection } from './CommentSectionContext'

const messages = {
  noCommentsTitle: 'Nothing here yet',
  noCommentsSubtitle: 'Be the first to comment on this track' // TODO: make this derive from entity type
}

export const CommentThread = () => {
  const { comments } = useCurrentCommentSection()
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
    <Flex direction='column' gap='m'>
      {comments.length === 0 ? (
        <Flex
          alignItems='center'
          justifyContent='center'
          direction='column'
          css={{ paddingTop: 80, paddingBottom: 80 }}
        >
          <Text>{messages.noCommentsTitle}</Text>
          <Text color='subdued'>{messages.noCommentsSubtitle}</Text>
        </Flex>
      ) : null}
      {comments.map((rootComment, i) => (
        <Flex key={rootComment.id} direction='column'>
          <CommentBlock comment={rootComment} parentCommentIndex={i} />
          <Flex ml='56px' direction='column' mt='l'>
            {rootComment?.replies?.length > 0 ? (
              <TextLink onClick={() => toggleReplies(rootComment.id)}>
                {hiddenReplies[rootComment.id] ? (
                  <IconCaretUp color='subdued' size='m' />
                ) : (
                  <IconCaretDown color='subdued' size='m' />
                )}
                {hiddenReplies[rootComment.id] ? 'Show' : 'Hide'} Replies
              </TextLink>
            ) : null}
          </Flex>
          {hiddenReplies[rootComment.id] ? null : (
            <Flex ml='56px' direction='column' mt='l' gap='l'>
              {rootComment?.replies?.map((reply) => (
                <Flex w='100%' key={reply.id}>
                  <CommentBlock
                    // TODO: fix type
                    comment={reply}
                    parentCommentId={rootComment.id}
                    parentCommentIndex={i}
                  />
                </Flex>
              ))}
            </Flex>
          )}
        </Flex>
      ))}
    </Flex>
  )
}
