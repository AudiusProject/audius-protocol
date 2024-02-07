import { ID } from '~/models/Identifiers'

export enum FavoriteType {
  TRACK = 'track',
  PLAYLIST = 'playlist'
}

export type Favorite = {
  save_item_id: ID
  save_type: FavoriteType
  user_id: number
  created_at: string
}
