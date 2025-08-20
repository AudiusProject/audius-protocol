import { Divider, Box, Flex, Paper } from '@audius/harmony-native'

import { Skeleton } from '../skeleton'

export const UserCardSkeleton = ({ noShimmer }: { noShimmer?: boolean }) => {
  return (
    <Paper border='default'>
      <Box p='m' pb='s'>
        <Skeleton
          style={{ width: '100%', aspectRatio: 1, borderRadius: 1000 }}
          noShimmer={noShimmer}
        />
      </Box>
      <Flex ph='l' pt='xs' pb='m' gap='xs' alignItems='center'>
        {/* marginBottom is simulating line-height */}
        <Skeleton
          height={18}
          width='90%'
          style={{ marginBottom: 6 }}
          noShimmer={noShimmer}
        />
        <Skeleton
          height={16}
          width={100}
          style={{ marginBottom: 4 }}
          noShimmer={noShimmer}
        />
      </Flex>
      <Divider />
      <Flex
        pv='s'
        backgroundColor='surface1'
        alignItems='center'
        borderBottomLeftRadius='m'
        borderBottomRightRadius='m'
      >
        {/* marginBottom is simulating line-height */}
        <Skeleton
          height={16}
          width={100}
          style={{ marginBottom: 2 }}
          noShimmer={noShimmer}
        />
      </Flex>
    </Paper>
  )
}
