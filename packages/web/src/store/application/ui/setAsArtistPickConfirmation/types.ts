import { ID } from '@audius/common'

export enum PinTrackAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  UPDATE = 'UPDATE'
}

export interface SetAsArtistPickConfirmationState {
  isVisible: boolean
  trackId?: ID
}
