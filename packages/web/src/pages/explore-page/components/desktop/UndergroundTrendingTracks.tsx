import { useMemo } from 'react'

import { useTrendingUnderground } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { TrackTile as DesktopTrackTile } from 'components/track/desktop/TrackTile'

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
      Tile={DesktopTrackTile}
    />
  )
}
