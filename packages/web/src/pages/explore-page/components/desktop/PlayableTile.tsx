import React, { useCallback, useMemo } from 'react'

import { useToggleTrack } from '@audius/common/hooks'
import { ID, Kind, UID } from '@audius/common/models'
import { QueueSource } from '@audius/common/store'
import { makeUid } from '@audius/common/utils'

import { TrackTileSize } from 'components/track/types'

// Wrapper component to make tiles playable
export const PlayableTile: React.FC<{
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
