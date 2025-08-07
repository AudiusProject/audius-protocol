import { useRecommendedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { full } from '@audius/sdk'

import { TrackTile } from 'components/track/desktop/TrackTile'

import { Carousel } from './Carousel'
import { TilePairs, TileSkeletons } from './TileHelpers'
import { DeferredChildProps, useDeferredElement } from './useDeferredElement'

const RecommendedTracksContent = ({ visible }: DeferredChildProps) => {
  const { data, isLoading } = useRecommendedTracks(
    {
      pageSize: 10,
      timeRange: full.GetRecommendedTracksTimeEnum.Week
    },
    {
      enabled: visible
    }
  )

  return !visible || isLoading || !data ? (
    <TileSkeletons Tile={TrackTile} />
  ) : (
    <TilePairs data={data} Tile={TrackTile} />
  )
}

export const RecommendedTracksSection = () => {
  const { ref, inView } = useDeferredElement({
    name: 'RecommendedTracksSection'
  })

  return (
    <Carousel ref={ref} title={messages.forYou}>
      <RecommendedTracksContent visible={inView} />
    </Carousel>
  )
}
