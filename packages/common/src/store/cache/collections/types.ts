import { Track, UID, User } from '../../../models'

export enum PlaylistOperations {
  ADD_TRACK = 'ADD_TRACK',
  REMOVE_TRACK = 'REMOVE_TRACK',
  REORDER = 'REORDER'
}

export type EnhancedCollectionTrack = Track & { user: User; uid: UID }
