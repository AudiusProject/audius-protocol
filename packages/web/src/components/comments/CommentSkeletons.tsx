import { Divider, Flex, Paper, Skeleton } from '@audius/harmony'

import { CommentHeader } from './CommentHeader'

const CommentBlockSkeleton = () => (
  <Flex direction='row' gap='s' alignItems='center' p='l'>
    <Skeleton w={40} h={40} css={{ borderRadius: 100 }} />
    <Flex gap='s'>
      <Skeleton w={20} h={240} />
      <Skeleton w={20} h={160} />
    </Flex>
  </Flex>
)

// TODO: mobile can also go in here
export const CommentSkeletons = () => (
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
      <CommentBlockSkeleton />
    </Paper>
  </Flex>
)
