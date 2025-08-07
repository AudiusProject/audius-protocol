import React from 'react'

import { useRecentlyCommentedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { TrackTile } from 'components/track/desktop/TrackTile'

import { Carousel } from './Carousel'
import { TilePairs, TileSkeletons } from './TileHelpers'
import { DeferredChildProps, useDeferredElement } from './useDeferredElement'

const ActiveDiscussionsContent = ({ visible }: DeferredChildProps) => {
  const { data, isLoading } = useRecentlyCommentedTracks(
    { pageSize: 10 },
    { enabled: visible }
  )

  return !visible || isLoading || !data ? (
    <TileSkeletons Tile={TrackTile} />
  ) : (
    <TilePairs data={data} Tile={TrackTile} />
  )
}

export const ActiveDiscussionsSection = () => {
  const { ref, inView } = useDeferredElement({
    name: 'ActiveDiscussionsSection'
  })

  return (
    <Carousel ref={ref} title={messages.activeDiscussions}>
      <ActiveDiscussionsContent visible={inView} />
    </Carousel>
  )
}
