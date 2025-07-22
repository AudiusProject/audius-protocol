import { useMemo } from 'react'

import { useTrendingUnderground } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { TrackCard } from 'components/track/TrackCard'

import { ExploreSection } from './ExploreSection'

export const UndergroundTrendingTracks = () => {
  const { data: undergroundTrendingTracks, isLoading } =
    useTrendingUnderground()

  const trackIds = useMemo(() => {
    return undergroundTrendingTracks.map(({ id }) => id)
  }, [undergroundTrendingTracks])

  if (!isLoading && undergroundTrendingTracks.length === 0) {
    return null
  }

  return (
    <ExploreSection
      isLoading={isLoading}
      title={messages.undergroundTrending}
      data={trackIds}
      Card={TrackCard}
    />
  )
}
