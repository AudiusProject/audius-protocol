import { useRecentPremiumTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { TrackTile } from 'components/track/desktop/TrackTile'

import { ExploreSection } from './ExploreSection'
import { TilePairs, TileSkeletons } from './TileHelpers'
import { DeferredChildProps, useDeferredElement } from './useDeferredElement'

const RecentPremiumTracksContent = ({ visible }: DeferredChildProps) => {
  const { data, isLoading } = useRecentPremiumTracks(
    { pageSize: 10 },
    { enabled: visible }
  )

  return !visible || isLoading || !data ? (
    <TileSkeletons Tile={TrackTile} />
  ) : (
    <TilePairs data={data} Tile={TrackTile} />
  )
}

export const RecentPremiumTracksSection = () => {
  const { ref, inView } = useDeferredElement({
    name: 'RecentPremiumTracksSection'
  })

  return (
    <ExploreSection ref={ref} title={messages.recentlyListedForSale}>
      <RecentPremiumTracksContent visible={inView} />
    </ExploreSection>
  )
}
