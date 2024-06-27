import { Flex, Paper, Skeleton } from '@audius/harmony'

export const LineupTileSkeleton = () => {
  return (
    <Paper w='100%'>
      <Flex alignItems='flex-start' style={{ padding: 10 }} gap='m' w='100%'>
        <Skeleton h={106} w={106} />
        <Flex direction='column' gap='s' flex={1} w='100%' mt='m'>
          <Skeleton w='80%' h={20} />
          <Skeleton w='60%' h={20} />
        </Flex>
      </Flex>
    </Paper>
  )
}
