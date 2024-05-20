import { ID, Kind } from '~/models'

export type SectionHeader = 'users' | 'tracks' | 'playlists' | 'albums'

export type SearchItem = {
  kind: Kind
  id: ID
}
