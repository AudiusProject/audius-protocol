import { View } from 'react-native'

import { Box, Flex } from '@audius/harmony-native'
import Skeleton from 'app/components/skeleton'

import { LineupTileActionButtons } from './LineupTileActionButtons'
import { LineupTileRoot } from './LineupTileRoot'

export const LineupTileSkeleton = () => {
  return (
    <LineupTileRoot>
      <Flex direction='row' alignItems='center' p='s' gap='m'>
        <Skeleton height={72} width={72} />
        <Flex gap='s' flex={1}>
          <Skeleton width='80%' height={20} />
          <Skeleton width='60%' height={20} />
        </Flex>
      </Flex>
      <Box h='l' />
      <View>
        <LineupTileActionButtons disabled />
      </View>
    </LineupTileRoot>
  )
}
