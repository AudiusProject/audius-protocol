import React, { useMemo } from 'react'

import { useTrendingUnderground } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { ExploreSection } from './ExploreSection'
import { TrackTileCarousel } from './TrackTileCarousel'

export const UndergroundTrendingTracks = () => {
  const { data: undergroundTrendingTracks, isLoading } =
    useTrendingUnderground()

  const trackIds = useMemo(() => {
    return undergroundTrendingTracks?.map(({ id }) => id) ?? []
  }, [undergroundTrendingTracks])

  if (!isLoading && undergroundTrendingTracks.length === 0) {
    return null
  }

  return (
    <ExploreSection title={messages.undergroundTrending}>
      <TrackTileCarousel
        tracks={trackIds}
        uidPrefix='underground-trending-track'
        isLoading={isLoading}
      />
    </ExploreSection>
  )
}
