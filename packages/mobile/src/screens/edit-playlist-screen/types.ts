import type { ID, Nullable } from '@audius/common'
import type { getTracks } from 'common/store/ui/createPlaylistModal/selectors'

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
