import { useRecommendedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { full } from '@audius/sdk'

import { TrackTile } from 'components/track/desktop/TrackTile'

import { ExploreSection } from './ExploreSection'

export const RecommendedTracksSection = () => {
  const { data, isLoading } = useRecommendedTracks({
    pageSize: 10,
    timeRange: full.GetRecommendedTracksTimeEnum.Week
  })

  if (!isLoading && (!data || data.length === 0)) {
    return null
  }

  return (
    <ExploreSection
      title={messages.forYou}
      data={data}
      isLoading={isLoading}
      Tile={TrackTile}
    />
  )
}
