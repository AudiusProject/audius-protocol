import { Divider, Flex, Paper, Skeleton, Text } from '@audius/harmony'

import { CommentInputForm } from './CommentInputForm'
import { useCurrentCommentSection } from './CommentSectionContext'
import { CommentThread } from './CommentThread'

export const CommentSectionDesktop = () => {
  const { userId, isLoading, comments } = useCurrentCommentSection()
  const commentPostAllowed = userId !== null

  if (isLoading)
    return (
      // TODO: this container is the same as below, should ideally reuse something somehow
      <Paper p='xl' w='100%' direction='column' gap='xl'>
        <Text variant='title' size='l'>
          Comments
        </Text>
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
    )

  // if (comments.length === 0) {
  //   return (
  //     <Paper p='xl' w='100%' direction='column' gap='xl'>
  //       No comments found
  //     </Paper>
  //   )
  // }

  return (
    <Flex gap='l' direction='column' w='100%' alignItems='flex-start'>
      <Text variant='title' size='l'>
        Comments ({comments.length})
      </Text>
      <Paper w='100%' direction='column'>
        {commentPostAllowed !== null ? (
          <>
            <Flex gap='s' p='xl' w='100%' direction='column'>
              <CommentInputForm />
            </Flex>

            <Divider color='default' orientation='horizontal' />
          </>
        ) : null}
        <Flex gap='s' p='xl' w='100%' direction='column'>
          <CommentThread />
        </Flex>
      </Paper>
    </Flex>
  )
}
