import { ID } from 'common/models/Identifiers'

export enum PinTrackAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  UPDATE = 'UPDATE'
}

export interface SetAsArtistPickConfirmationState {
  isVisible: boolean
  trackId?: ID
}
