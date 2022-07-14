import type { ID } from '@audius/common'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { getTracks } from 'common/store/ui/createPlaylistModal/selectors'

export type Image = {
  height?: number
  width?: number
  name?: string
  size?: number
  fileType?: string
  url: string
  file?: string
}

export type PlaylistValues = {
  playlist_name: string
  description: Nullable<string>
  artwork: Image
  tracks: ReturnType<typeof getTracks>
  track_ids: {
    time: number
    track: ID
  }[]
  removedTracks: { trackId: ID; timestamp: number }[]
}

export type UpdatedPlaylist = Omit<PlaylistValues, 'cover_art'> & {
  updatedCoverArt?: Image
}
