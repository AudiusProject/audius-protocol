// import { CommentForm } from './CommentForm'
// import { CommentHeader } from './CommentHeader'
// import { useCurrentCommentSection } from './CommentSectionContext'
// import { CommentThread } from './CommentThread'

import { Divider, Flex, Paper } from '@audius/harmony-native'

import Skeleton from '../skeleton'

import { CommentHeader } from './CommentHeader'
import { useCurrentCommentSection } from './CommentSectionProvider'

export const CommentSection = () => {
  const {
    userId,
    isLoading,
    comments,
    handlePostComment,
    handleLoadMoreRootComments
  } = useCurrentCommentSection()

  // Loading state
  if (isLoading)
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
            {/* <Skeleton w='40px' h='40px' css={{ borderRadius: '100%' }} />
            <Skeleton w='100%' h='60px' /> */}
          </Flex>
          {/* <Divider color='default' orientation='horizontal' />
          <Skeleton w='100%' h='120px' />
          <Skeleton w='100%' h='120px' />
          <Skeleton w='100%' h='120px' />
          <Skeleton w='100%' h='120px' /> */}
        </Paper>
      </Flex>
    )

  return (
    <Flex gap='l' direction='column' w='100%' alignItems='flex-start'>
      <CommentHeader commentCount={comments.length} />
      <Paper w='100%' direction='column'>
        <Flex gap='s' p='xl' w='100%' direction='column'>
          {/* <CommentThread /> */}
        </Flex>
      </Paper>
    </Flex>
  )
}
