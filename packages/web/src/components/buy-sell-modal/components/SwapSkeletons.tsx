import { Flex, Skeleton } from '@audius/harmony'

export const YouPaySkeleton = () => (
  <Flex direction='column' gap='s'>
    <Flex justifyContent='space-between' alignItems='flex-start'>
      <Skeleton w='100px' h='24px' />
      <Skeleton w='160px' h='24px' />
    </Flex>
    <Skeleton w='100%' h='64px' />
  </Flex>
)

export const YouReceiveSkeleton = () => (
  <Flex direction='column' gap='s'>
    <Skeleton w='120px' h='24px' />
    <Skeleton w='100%' h='64px' />
    <Skeleton w='100%' h='64px' />
  </Flex>
)

export const SwapFormSkeleton = () => (
  <Flex direction='column' gap='xl'>
    <YouPaySkeleton />
    <YouReceiveSkeleton />
  </Flex>
)
