import React from 'react'

import { useRecommendedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { QueueSource } from '@audius/common/store'

import { ExploreSection } from './ExploreSection'
import { TrackTileCarousel } from './TrackTileCarousel'

export const RecommendedTracks = () => {
  const { data: recommendedTracks, isLoading } = useRecommendedTracks()

  if (!isLoading && (!recommendedTracks || recommendedTracks.length === 0)) {
    return null
  }

  return (
    <ExploreSection title={messages.forYou}>
      <TrackTileCarousel
        tracks={recommendedTracks}
        isLoading={isLoading}
        source={QueueSource.EXPLORE}
      />
    </ExploreSection>
  )
}
