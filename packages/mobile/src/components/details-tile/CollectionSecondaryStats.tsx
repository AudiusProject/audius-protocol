import { useGetPlaylistById, useGetCurrentUserId } from '@audius/common/api'
import { useCollectionSecondaryStats } from '@audius/common/hooks'
import type { ID, Track } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  type CommonState
} from '@audius/common/store'
import { useSelector } from 'react-redux'

import { Flex } from '@audius/harmony-native'

import { SecondaryStatRow } from './SecondaryStatRow'

const { getCollectionTracks } = cacheCollectionsSelectors

type CollectionSecondaryStatsProps = {
  collectionId?: ID
}

/**
 * The additional metadata shown at the bottom of the Collection Screen Headers
 */
export const CollectionSecondaryStats = ({
  collectionId
}: CollectionSecondaryStatsProps) => {
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: collection } = useGetPlaylistById(
    { playlistId: collectionId!, currentUserId },
    { disabled: !collectionId }
  )
  const collectionTracks = useSelector((state: CommonState) =>
    getCollectionTracks(state, { id: collectionId })
  )

  const duration =
    collectionTracks?.reduce(
      (acc: number, track: Track) => acc + track.duration,
      0
    ) ?? 0

  const { labels } = useCollectionSecondaryStats({
    duration,
    numTracks: collection?.playlist_contents?.track_ids?.length,
    isScheduledRelease: collection?.is_scheduled_release,
    releaseDate: collection?.release_date,
    updatedAt: collection?.updated_at
  })

  return (
    <Flex gap='l' w='100%' direction='row' wrap='wrap'>
      {labels.map((label, i) => (
        <SecondaryStatRow key={i} label={label.label}>
          {label.value}
        </SecondaryStatRow>
      ))}
    </Flex>
  )
}
