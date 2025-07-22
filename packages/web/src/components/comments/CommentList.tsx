import { useCurrentCommentSection } from '@audius/common/context'
import { Flex } from '@audius/harmony'

import { CommentBlockSkeletons } from './CommentSkeletons'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

type CommentListProps = {
  highlightedCommentId?: number | null
}

export const CommentList = ({ highlightedCommentId }: CommentListProps) => {
  const { commentIds, commentSectionLoading } = useCurrentCommentSection()

  return (
    <Flex p='l' as='ul' column gap='xl' w='100%' backgroundColor='white'>
      {commentSectionLoading ? (
        <CommentBlockSkeletons />
      ) : (
        <>
          {commentIds.length === 0 ? <NoComments /> : null}
          {highlightedCommentId ? (
            <CommentThread commentId={highlightedCommentId} />
          ) : null}
          {commentIds
            .filter((id) => id !== highlightedCommentId)
            .map((id) => (
              <CommentThread commentId={id} key={id} />
            ))}
        </>
      )}
    </Flex>
  )
}
