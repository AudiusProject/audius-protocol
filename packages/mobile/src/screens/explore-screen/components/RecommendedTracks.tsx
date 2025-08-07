import React from 'react'

import { useRecommendedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { QueueSource } from '@audius/common/store'
import { full } from '@audius/sdk'

import { ExploreSection } from './ExploreSection'
import { TrackTileCarousel } from './TrackTileCarousel'

export const RecommendedTracks = () => {
  const { data: recommendedTracks, isLoading } = useRecommendedTracks({
    pageSize: 10,
    timeRange: full.GetRecommendedTracksTimeEnum.Week
  })

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
