import { useMemo } from 'react'

import { useTrendingUnderground } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { TrackTile as MobileTrackTile } from 'components/track/mobile/TrackTile'

import { ExploreSection } from '../desktop/ExploreSection'

export const UndergroundTrendingSection = () => {
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
      Tile={MobileTrackTile}
    />
  )
}
