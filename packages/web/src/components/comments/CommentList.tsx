import { useCurrentCommentSection } from '@audius/common/context'
import { Flex } from '@audius/harmony'

import { CommentSkeletons } from './CommentSkeletons'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

export const CommentList = () => {
  const { comments, commentSectionLoading } = useCurrentCommentSection()

  // TODO: break out list skeleton from reply skeleton
  if (commentSectionLoading) {
    return <CommentSkeletons />
  }

  return (
    <Flex p='l' as='ul' column gap='xl' w='100%' backgroundColor='white'>
      {comments.length === 0 ? <NoComments /> : null}
      {comments.map(({ id }) => (
        <CommentThread commentId={id} key={id} />
      ))}
    </Flex>
  )
}
