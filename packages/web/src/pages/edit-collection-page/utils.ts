import { Collection } from '@audius/common/models'
import { CollectionValues } from '@audius/common/schemas'
import { Maybe } from '@audius/common/utils'

import { removeNullable } from 'utils/typeUtils'

// The edit collection form receives a tracks array, but we need to convert that to playlist_contents
export const updatePlaylistContents = (
  tracks: CollectionValues['tracks'],
  playlist_contents: Maybe<Collection['playlist_contents']>
) => {
  if (!playlist_contents) return undefined

  const originalTracksMap = new Map(
    playlist_contents?.track_ids.map((item) => [item.track, item])
  )

  const updatedPlaylistIds = tracks
    .map(
      (track) =>
        track.metadata.track_id &&
        originalTracksMap.get(track.metadata.track_id)
    )
    .filter(removeNullable)

  return { track_ids: updatedPlaylistIds }
}
