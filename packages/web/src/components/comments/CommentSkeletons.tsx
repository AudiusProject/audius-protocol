import { Flex, Skeleton } from '@audius/harmony'

const CommentBlockSkeleton = () => (
  <Flex direction='row' gap='s' alignItems='center' p='l'>
    <Skeleton w={40} h={40} css={{ borderRadius: 100, flexShrink: 0 }} />
    <Flex gap='s' direction='column'>
      <Skeleton h={20} w={240} />
      <Skeleton h={20} w={160} />
    </Flex>
  </Flex>
)

// TODO: mobile can also go in here
export const CommentSkeletons = () => (
  <Flex
    gap='s'
    direction='column'
    w='100%'
    h='100%'
    alignItems='flex-start'
    mt='s'
  >
    <CommentBlockSkeleton />
    <CommentBlockSkeleton />
    <CommentBlockSkeleton />
    <CommentBlockSkeleton />
    <CommentBlockSkeleton />
  </Flex>
)
