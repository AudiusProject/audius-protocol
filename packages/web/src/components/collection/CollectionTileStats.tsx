import { useIsCollectionUnlockable } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { cacheCollectionsSelectors } from '@audius/common/store'
import { Flex, Skeleton } from '@audius/harmony'

import { EntityRank } from 'components/lineup/EntityRank'
import { TrackTileSize } from 'components/track/types'
import { useIsMobile } from 'hooks/useIsMobile'
import { useSelector } from 'utils/reducer'

import { CollectionAccessTypeLabel } from './CollectionAccessTypeLabel'
import { CollectionLockedStatusBadge } from './CollectionLockedStatusBadge'
import { RepostsMetric, SavesMetric } from './CollectionTileMetrics'

const { getCollection } = cacheCollectionsSelectors

type CollectionTileStatsProps = {
  collectionId: ID
  isTrending?: boolean
  rankIndex?: number
  size: TrackTileSize
  isLoading?: boolean
}

export const CollectionTileStats = (props: CollectionTileStatsProps) => {
  const { collectionId, isTrending, rankIndex, size, isLoading } = props

  const isMobile = useIsMobile()
  const isUnlockable = useIsCollectionUnlockable(collectionId)

  const isPrivate = useSelector((state) => {
    return getCollection(state, { id: collectionId })?.is_private
  })

  if (isLoading) {
    return <Skeleton w='30%' h={isMobile ? 16 : 20} />
  }

  return (
    <Flex
      justifyContent='space-between'
      alignItems='center'
      pv={isMobile ? 's' : 'xs'}
    >
      <Flex gap='l'>
        {isTrending && rankIndex !== undefined ? (
          <EntityRank index={rankIndex} />
        ) : null}
        <CollectionAccessTypeLabel collectionId={collectionId} />
        {isPrivate ? null : (
          <>
            <RepostsMetric collectionId={collectionId} size={size} />
            <SavesMetric collectionId={collectionId} />
          </>
        )}
      </Flex>
      {isUnlockable ? (
        <CollectionLockedStatusBadge collectionId={collectionId} />
      ) : null}
    </Flex>
  )
}
