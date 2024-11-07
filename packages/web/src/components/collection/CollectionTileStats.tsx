import { useGetPlaylistById } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { Flex, Skeleton } from '@audius/harmony'

import { EntityRank } from 'components/lineup/EntityRank'
import { TrackTileSize } from 'components/track/types'
import { useIsMobile } from 'hooks/useIsMobile'

import { CollectionAccessTypeLabel } from './CollectionAccessTypeLabel'
import {
  CollectionLockedStatusPill,
  useIsCollectionUnlockable
} from './CollectionLockedStatusPill'
import { RepostsMetric, SavesMetric } from './CollectionTileMetrics'

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

  const { data: collection } = useGetPlaylistById(
    { playlistId: collectionId },
    { disabled: !!collectionId }
  )

  if (isLoading || !collection) {
    return <Skeleton w='30%' h={isMobile ? 16 : 20} />
  }

  const { is_private } = collection

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
        {is_private ? null : (
          <>
            <RepostsMetric collectionId={collectionId} size={size} />
            <SavesMetric collectionId={collectionId} />
          </>
        )}
      </Flex>
      {isUnlockable ? (
        <CollectionLockedStatusPill collectionId={collectionId} />
      ) : null}
    </Flex>
  )
}
