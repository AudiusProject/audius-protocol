import { Status } from '@audius/common/models'
import { Button, Divider, Flex, Paper, Skeleton } from '@audius/harmony'

import { CommentForm } from './CommentForm'
import { CommentHeader } from './CommentHeader'
import { useCurrentCommentSection } from './CommentSectionContext'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

export const CommentSectionDesktop = () => {
  const {
    userId,
    comments,
    commentSectionLoading,
    usePostComment,
    handleLoadMoreRootComments
  } = useCurrentCommentSection()
  const [postComment, { status: postCommentStatus }] = usePostComment()
  const handlePostComment = (message: string) => {
    postComment(message, undefined)
  }
  const commentPostAllowed = userId !== null

  // Loading state
  if (commentSectionLoading)
    return (
      <Flex gap='l' direction='column' w='100%' alignItems='flex-start'>
        <CommentHeader isLoading />
        <Paper p='xl' w='100%' direction='column' gap='xl'>
          <Flex
            gap='s'
            w='100%'
            h='60px'
            alignItems='center'
            justifyContent='center'
          >
            <Skeleton w='40px' h='40px' css={{ borderRadius: '100%' }} />
            <Skeleton w='100%' h='60px' />
          </Flex>
          <Divider color='default' orientation='horizontal' />
          <Skeleton w='100%' h='120px' />
          <Skeleton w='100%' h='120px' />
          <Skeleton w='100%' h='120px' />
          <Skeleton w='100%' h='120px' />
        </Paper>
      </Flex>
    )

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
