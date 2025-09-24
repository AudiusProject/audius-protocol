import { Flex, Skeleton } from '@audius/harmony'

export const YouPaySkeleton = () => (
  <Flex direction='column' gap='m'>
    <Flex justifyContent='space-between' alignItems='center'>
      <Skeleton w='80px' h='28px' />
      <Skeleton w='140px' h='20px' />
    </Flex>
    <Flex alignItems='center' gap='s'>
      <Skeleton w='100%' h='64px' />
      <Skeleton w='60px' h='64px' />
      <Skeleton w='48px' h='48px' />
    </Flex>
  </Flex>
)

export const YouReceiveSkeleton = () => (
  <Flex direction='column' gap='m'>
    <Skeleton w='120px' h='28px' />
    <Flex alignItems='center' gap='s'>
      <Skeleton w='100%' h='64px' />
      <Skeleton w='60px' h='64px' />
    </Flex>
  </Flex>
)

export const SwapFormSkeleton = () => (
  <Flex direction='column' gap='xl'>
    <YouPaySkeleton />
    <YouReceiveSkeleton />
  </Flex>
)
