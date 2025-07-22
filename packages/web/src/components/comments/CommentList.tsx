import { useCurrentCommentSection } from '@audius/common/context'
import { Flex } from '@audius/harmony'

import { CommentBlockSkeletons } from './CommentSkeletons'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

type CommentListProps = {
  highlightCommentId?: number | null
}

export const CommentList = ({ highlightCommentId }: CommentListProps) => {
  const { commentIds, commentSectionLoading } = useCurrentCommentSection()

  return (
    <Flex p='l' as='ul' column gap='xl' w='100%' backgroundColor='white'>
      {commentSectionLoading ? (
        <CommentBlockSkeletons />
      ) : (
        <>
          {commentIds.length === 0 ? <NoComments /> : null}
          {highlightCommentId ? (
            <CommentThread commentId={highlightCommentId} />
          ) : null}
          {commentIds
            .filter((id) => id !== highlightCommentId)
            .map((id) => (
              <CommentThread commentId={id} key={id} />
            ))}
        </>
      )}
    </Flex>
  )
}
