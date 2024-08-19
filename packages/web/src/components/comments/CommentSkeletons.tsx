import { Divider, Flex, Paper, Skeleton } from '@audius/harmony'

import { CommentHeader } from './CommentHeader'

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
      <Skeleton w='100%' h='120px' />
      <Skeleton w='100%' h='120px' />
      <Skeleton w='100%' h='120px' />
      <Skeleton w='100%' h='120px' />
    </Paper>
  </Flex>
)
