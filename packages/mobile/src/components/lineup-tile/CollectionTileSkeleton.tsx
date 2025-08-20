import {
  Divider,
  Flex,
  IconHeart,
  IconRepost,
  IconShare,
  Paper
} from '@audius/harmony-native'
import Skeleton from 'app/components/skeleton'

interface CollectionTileSkeletonProps {
  noShimmer?: boolean
}

export const CollectionTileSkeleton = ({
  noShimmer
}: CollectionTileSkeletonProps) => {
  return (
    <Paper>
      <Flex h={317} justifyContent='space-between'>
        {/* Top section with image and metadata */}
        <Flex direction='row' alignItems='flex-start' p='s' gap='m'>
          {/* Collection image skeleton */}
          <Skeleton height={80} width={80} noShimmer={noShimmer} />

          {/* Title and type skeleton */}
          <Flex gap='s' flex={1}>
            {/* Collection type label */}
            <Skeleton width={60} height={16} noShimmer={noShimmer} />
            {/* Collection title */}
            <Skeleton width='90%' height={20} noShimmer={noShimmer} />
            {/* User name */}
            <Skeleton width='70%' height={18} noShimmer={noShimmer} />
          </Flex>
        </Flex>

        {/* Track list skeleton */}
        <Flex ph='s' gap='l'>
          <Skeleton width='100%' height={16} noShimmer={noShimmer} />
          <Skeleton width='90%' height={16} noShimmer={noShimmer} />
          <Skeleton width='85%' height={16} noShimmer={noShimmer} />
        </Flex>

        <Flex>
          {/* Bottom section with action buttons */}
          <Divider mh='s' />
          <Flex
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            p='s'
          >
            <Flex direction='row' gap='2xl'>
              <IconRepost color='disabled' />
              <IconHeart color='disabled' />
              <IconShare color='disabled' />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Paper>
  )
}
