import { useCurrentCommentSection } from '@audius/common/context'
import { Status } from '@audius/common/models'
import { Button, Divider, Flex, Paper } from '@audius/harmony'

import { CommentForm } from './CommentForm'
import { CommentHeader } from './CommentHeader'
import { CommentSkeletons } from './CommentSkeletons'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

export const CommentSectionDesktop = () => {
  const {
    currentUserId,
    comments,
    commentSectionLoading,
    usePostComment,
    handleLoadMoreRootComments
  } = useCurrentCommentSection()
  const [postComment, { status: postCommentStatus }] = usePostComment()
  const handlePostComment = (message: string) => {
    postComment(message, undefined)
  }
  const commentPostAllowed = currentUserId !== null

  if (commentSectionLoading) {
    return <CommentSkeletons />
  }

  return (
    <Flex gap='l' direction='column' w='100%' alignItems='flex-start'>
      <CommentHeader commentCount={comments.length} />
      <Paper w='100%' direction='column'>
        {commentPostAllowed !== null ? (
          <>
            <Flex gap='s' p='xl' w='100%' direction='column'>
              <CommentForm
                onSubmit={handlePostComment}
                isLoading={postCommentStatus === Status.LOADING}
              />
            </Flex>

            <Divider color='default' orientation='horizontal' />
          </>
        ) : null}
        <Flex gap='s' p='xl' w='100%' direction='column'>
          <Flex direction='column' gap='m'>
            {comments.length === 0 ? <NoComments /> : null}
            {comments.map(({ id }) => (
              <CommentThread commentId={id} key={id} />
            ))}
          </Flex>
          {/* TODO: this button is temporary; will be replaced with endless scroll */}
          <Button
            onClick={() => {
              handleLoadMoreRootComments()
            }}
            size='small'
            css={{ width: 'max-content', marginTop: '16px' }}
          >
            Load more comments
          </Button>
        </Flex>
      </Paper>
    </Flex>
  )
}
