import { useCollection } from '@audius/common/api'
import { useIsCollectionUnlockable } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'

import { Flex } from '@audius/harmony-native'

import { CollectionAccessTypeLabel } from '../collection/CollectionAccessTypeLabel'
import { CollectionLockedStatusBadge } from '../collection/CollectionLockedStatusBadge'
import { CollectionDownloadStatusIndicator } from '../offline-downloads'

import { RepostsMetric, SavesMetric } from './CollectionTileMetrics'
import { LineupTileRankIcon } from './LineupTileRankIcon'

type CollectionTileStatsProps = {
  collectionId: ID
  isTrending?: boolean
  rankIndex?: number
}

export const CollectionTileStats = (props: CollectionTileStatsProps) => {
  const { collectionId, isTrending, rankIndex } = props

  const isUnlockable = useIsCollectionUnlockable(collectionId)

  const { data: isPrivate } = useCollection(collectionId, {
    select: (collection) => collection.is_private
  })

  return (
    <Flex row justifyContent='space-between' alignItems='center' p='s'>
      <Flex direction='row' gap='m'>
        {isTrending && rankIndex !== undefined ? (
          <LineupTileRankIcon index={rankIndex} />
        ) : null}
        <CollectionAccessTypeLabel collectionId={collectionId} />
        {isPrivate ? null : (
          <>
            <RepostsMetric collectionId={collectionId} />
            <SavesMetric collectionId={collectionId} />
            <CollectionDownloadStatusIndicator
              size='s'
              collectionId={collectionId}
            />
          </>
        )}
      </Flex>
      {isUnlockable ? (
        <CollectionLockedStatusBadge collectionId={collectionId} />
      ) : null}
    </Flex>
  )
}
