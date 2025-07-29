import React from 'react'

import { useMostSharedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { QueueSource } from '@audius/common/store'

import { ExploreSection } from './ExploreSection'
import { TrackTileCarousel } from './TrackTileCarousel'

export const MostSharedTracks = () => {
  const { data: mostSharedTracks, isLoading } = useMostSharedTracks()

  if (!isLoading && (!mostSharedTracks || mostSharedTracks.length === 0)) {
    return null
  }

  return (
    <ExploreSection title={messages.mostShared}>
      <TrackTileCarousel
        tracks={mostSharedTracks}
        isLoading={isLoading}
        source={QueueSource.EXPLORE}
      />
    </ExploreSection>
  )
}
