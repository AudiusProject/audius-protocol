import { Divider, Flex, Paper, Skeleton, Text } from '@audius/harmony'

import { CommentForm } from './CommentForm'
import { useCurrentCommentSection } from './CommentSectionContext'
import { CommentThread } from './CommentThread'

export const CommentSectionDesktop = () => {
  const { userId, isLoading, comments } = useCurrentCommentSection()
  const commentPostAllowed = userId !== null

  if (isLoading)
    return (
      <Flex gap='l' direction='column' w='100%' alignItems='flex-start'>
        <Text variant='title' size='l'>
          Comments
        </Text>
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
      <Text variant='title' size='l'>
        Comments ({comments.length})
      </Text>
      <Paper w='100%' direction='column'>
        {commentPostAllowed !== null ? (
          <>
            <Flex gap='s' p='xl' w='100%' direction='column'>
              <CommentForm />
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
