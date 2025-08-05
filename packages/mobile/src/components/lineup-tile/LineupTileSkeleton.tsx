import {
  Divider,
  Flex,
  IconHeart,
  IconRepost,
  IconShare
} from '@audius/harmony-native'
import Skeleton from 'app/components/skeleton'

import { LineupTileRoot } from './LineupTileRoot'

export const LineupTileSkeleton = () => {
  return (
    <LineupTileRoot>
      <Flex flex={1} justifyContent='space-between'>
        <Flex direction='row' alignItems='center' p='s' gap='m'>
          <Skeleton height={80} width={80} />
          <Flex gap='s' flex={1}>
            <Skeleton width='80%' height={20} />
            <Skeleton width='60%' height={20} />
          </Flex>
        </Flex>
        <Divider mh='s' pt='l' />
        <Flex row gap='2xl' p='s'>
          <IconRepost color='disabled' />
          <IconHeart color='disabled' />
          <IconShare color='disabled' />
        </Flex>
      </Flex>
    </LineupTileRoot>
  )
}
