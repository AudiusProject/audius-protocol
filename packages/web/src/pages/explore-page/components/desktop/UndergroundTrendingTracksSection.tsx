import { useMemo } from 'react'

import { useTrendingUnderground } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { Status } from '@audius/common/models'

import { TrackTile as DesktopTrackTile } from 'components/track/desktop/TrackTile'
import { TrackTile as MobileTrackTile } from 'components/track/mobile/TrackTile'
import { useIsMobile } from 'hooks/useIsMobile'

import { Carousel } from './Carousel'
import { TilePairs, TileSkeletons } from './TileHelpers'
import { DeferredChildProps, useDeferredElement } from './useDeferredElement'

const UndergroundTrendingTracksContent = ({ visible }: DeferredChildProps) => {
  const isMobile = useIsMobile()
  const {
    data: undergroundTrendingTracks,
    isLoading: hookIsLoading,
    lineup
  } = useTrendingUnderground({ pageSize: 10 }, { enabled: visible })

  const isLoading = hookIsLoading || lineup.status === Status.LOADING

  const trackIds = useMemo(() => {
    return undergroundTrendingTracks.map(({ id }) => id)
  }, [undergroundTrendingTracks])

  const TrackTile = isMobile ? MobileTrackTile : DesktopTrackTile

  return !visible || isLoading || !trackIds.length ? (
    <TileSkeletons Tile={TrackTile} />
  ) : (
    <TilePairs data={trackIds} Tile={TrackTile} />
  )
}

export const UndergroundTrendingTracksSection = () => {
  const { ref, inView } = useDeferredElement({
    name: 'UndergroundTrendingTracksSection'
  })

  return (
    <Carousel
      ref={ref}
      title={messages.undergroundTrending}
      viewAllLink='/explore/underground'
    >
      <UndergroundTrendingTracksContent visible={inView} />
    </Carousel>
  )
}
