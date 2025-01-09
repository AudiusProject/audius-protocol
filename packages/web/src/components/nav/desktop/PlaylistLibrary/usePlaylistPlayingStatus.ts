import { useMemo } from 'react'

import { PlaylistLibraryID } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  playerSelectors,
  queueSelectors,
  QueueSource,
  CommonState
} from '@audius/common/store'
import { Uid } from '@audius/common/utils'
import { useSelector } from 'react-redux'

const { getCollection } = cacheCollectionsSelectors
const { getTrackId, getPlaying } = playerSelectors
const { getSource, getUid } = queueSelectors

/**
 * Used to determine if a track from a specific playlist is currently playing.
 *
 * @param {PlaylistLibraryID} id - The ID of the playlist to check against.
 * @returns {boolean} - Returns true if the current track is from the specified playlist and is playing, otherwise false.
 */
export const usePlaylistPlayingStatus = (id: PlaylistLibraryID) => {
  const currentTrackId = useSelector(getTrackId)
  const isPlaying = useSelector(getPlaying)
  const queueSource = useSelector(getSource)
  const currentUid = useSelector(getUid)

  const collection = useSelector((state: CommonState) =>
    getCollection(state, { id: typeof id === 'string' ? null : id })
  )

  return useMemo(() => {
    const hasTracks = collection?.playlist_contents?.track_ids
    const hasCurrentTrack = currentTrackId

    if (!hasTracks || !hasCurrentTrack || !isPlaying) return false

    const hasTrack = collection.playlist_contents.track_ids.some(
      (trackItem) => trackItem.track === currentTrackId
    )

    const isSource =
      currentUid &&
      queueSource === QueueSource.COLLECTION_TRACKS &&
      Uid.fromString(currentUid).source === `collection:${id}`

    return hasTrack && isSource
  }, [collection, currentTrackId, isPlaying, currentUid, queueSource, id])
}
