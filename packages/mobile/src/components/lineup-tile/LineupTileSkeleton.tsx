import { StyleSheet, View } from 'react-native'

import { Flex } from '@audius/harmony-native'
import Skeleton from 'app/components/skeleton'

import { LineupTileActionButtons } from './LineupTileActionButtons'
import { LineupTileRoot } from './LineupTileRoot'

const styles = StyleSheet.create({
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    width: '100%'
  }
})

export const LineupTileSkeleton = () => {
  return (
    <LineupTileRoot>
      <Flex direction='row' alignItems='center' style={{ padding: 10 }} gap='m'>
        <Skeleton height={72} width={72} />
        <Flex gap='s' flex={1}>
          <Skeleton width='80%' height={20} />
          <Skeleton width='60%' height={20} />
        </Flex>
      </Flex>

      <View style={styles.bottomButtons}>
        <LineupTileActionButtons disabled />
      </View>
    </LineupTileRoot>
  )
}
