import React, { useCallback, useMemo } from 'react'

import { useToggleTrack } from '@audius/common/hooks'
import { ID, Kind, UID } from '@audius/common/models'
import { QueueSource } from '@audius/common/store'
import { makeUid } from '@audius/common/utils'
import { Flex } from '@audius/harmony'

import { TrackTileSize } from 'components/track/types'
import { useIsMobile } from 'hooks/useIsMobile'

import { Carousel } from './Carousel'
import { TILE_WIDTH, MOBILE_TILE_WIDTH } from './constants'

// Wrapper component to make tiles playable
const PlayableTile: React.FC<{
  id: ID
  index: number
  Tile: React.ComponentType<any>
  [key: string]: any
}> = ({ id, index, Tile, ...props }) => {
  const uid = useMemo(() => makeUid(Kind.TRACKS, id, QueueSource.EXPLORE), [id])

  const { togglePlay, isTrackPlaying } = useToggleTrack({
    id,
    uid,
    source: QueueSource.EXPLORE
  })

  // Create lineup-style togglePlay function that TrackTile expects
  const handleTogglePlay = useCallback(
    (tileUid: UID, trackId: ID) => {
      if (tileUid === uid && trackId === id) {
        togglePlay()
      }
    },
    [uid, id, togglePlay]
  )

  return (
    <Tile
      {...props}
      uid={uid}
      id={id}
      index={index}
      togglePlay={handleTogglePlay}
      isActive={isTrackPlaying}
      size={TrackTileSize.LARGE}
      statSize='large'
      ordered={false}
      hasLoaded={() => {}}
      isLoading={false}
      isTrending={false}
      isFeed={false}
    />
  )
}

type ExploreSectionProps = {
  title: string
  data?: number[]
  isLoading?: boolean
  Card?: React.ComponentType<any>
  Tile?: React.ComponentType<any>
}
export const ExploreSection: React.FC<ExploreSectionProps> = ({
  title,
  data,
  isLoading,
  Card,
  Tile
}) => {
  const isMobile = useIsMobile()

  const renderTilePairs = (data: number[], Tile: React.ComponentType<any>) => {
    const tileWidth = isMobile ? MOBILE_TILE_WIDTH : TILE_WIDTH
    const pairs = []
    for (let i = 0; i < data.length; i += 2) {
      pairs.push(data.slice(i, i + 2))
    }
    return pairs.map((pair, pairIndex) => (
      <Flex
        key={pairIndex}
        direction='column'
        gap='m'
        css={{ minWidth: tileWidth, width: tileWidth }}
      >
        {pair.map((id, idIndex) => (
          <PlayableTile
            key={id}
            id={id}
            index={pairIndex * 2 + idIndex}
            Tile={Tile}
            size='l'
            variant={TrackTileSize.LARGE}
          />
        ))}
      </Flex>
    ))
  }

  const renderTileSkeletons = (Tile: React.ComponentType<any>) => {
    const tileWidth = isMobile ? MOBILE_TILE_WIDTH : TILE_WIDTH
    return Array.from({ length: 2 }).map((_, i) => (
      <Flex
        key={i}
        direction='column'
        gap='m'
        css={{ minWidth: tileWidth, width: tileWidth }}
      >
        <Tile key={`${i}-0`} id={0} size='m' />
        <Tile key={`${i}-1`} id={0} size='m' />
      </Flex>
    ))
  }

  return (
    <Carousel title={title}>
      {Tile && !Card
        ? isLoading || !data
          ? renderTileSkeletons(Tile)
          : renderTilePairs(data, Tile)
        : null}
      {Card
        ? !data || isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              // loading skeletons
              <Card key={i} id={0} size={isMobile ? 'xs' : 's'} />
            ))
          : data?.map((id) => <Card key={id} id={id} size='s' />)
        : null}
    </Carousel>
  )
}
