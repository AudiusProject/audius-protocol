import { Flex, Skeleton } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

export const CommentBlockSkeleton = () => {
  const isMobile = useIsMobile()
  return (
    <Flex direction='row' gap='l' alignItems='center' w='100%'>
      <Skeleton
        w={40}
        h={40}
        ml='2px'
        css={{ borderRadius: 100, flexShrink: 0, alignSelf: 'flex-start' }}
      />
      <Flex gap='s' direction='column' w='100%'>
        <Skeleton h={isMobile ? 20 : 28} w='100%' />
        <Skeleton h={isMobile ? 20 : 28} w='80%' />
        {!isMobile ? <Skeleton h={20} w='30%' /> : null}
      </Flex>
    </Flex>
  )
}

export const CommentFormSkeleton = () => (
  <Flex gap='s' w='100%' h='60px' alignItems='center' justifyContent='center'>
    <Skeleton w='40px' h='40px' css={{ borderRadius: '100%' }} />
    <Skeleton w='100%' h='60px' />
  </Flex>
)

export const CommentBlockSkeletons = () => {
  return (
    <>
      <CommentBlockSkeleton />
      <CommentBlockSkeleton />
      <CommentBlockSkeleton />
      <CommentBlockSkeleton />
      <CommentBlockSkeleton />
    </>
  )
}

export const SortBarSkeletons = () => (
  <Flex gap='s' direction='row'>
    <Skeleton w='55px' h='26px' css={{ borderRadius: 100 }} />
    <Skeleton w='80px' h='26px' css={{ borderRadius: 100 }} />
    <Skeleton w='110px' h='26px' css={{ borderRadius: 100 }} />
  </Flex>
)
