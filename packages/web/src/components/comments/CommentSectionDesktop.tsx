import { useCurrentCommentSection } from '@audius/common/context'
import { Button, Divider, Flex, Paper } from '@audius/harmony'

import { CommentForm } from './CommentForm'
import { CommentHeader } from './CommentHeader'
import { CommentSkeletons } from './CommentSkeletons'
import { CommentSortBar } from './CommentSortBar'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

export const CommentSectionDesktop = () => {
  const {
    currentUserId,
    comments,
    commentSectionLoading,
    handleLoadMoreRootComments
  } = useCurrentCommentSection()

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
              <CommentForm />
            </Flex>

            <Divider color='default' orientation='horizontal' />
          </>
        ) : null}
        <Flex ph='xl' pv='l' w='100%' direction='column' gap='l'>
          <CommentSortBar />
          <Flex direction='column' gap='m' pt='m'>
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
