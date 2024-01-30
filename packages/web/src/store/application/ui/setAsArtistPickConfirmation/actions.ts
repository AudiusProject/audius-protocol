import { ID } from '@audius/common/models'
import {} from '@audius/common'

// actions
export const SHOW_SET_AS_ARTIST_PICK_CONFIRMATION = 'SET_AS_ARTIST_PICK/SHOW'
export const HIDE_SET_AS_ARTIST_PICK_CONFIRMATION = 'SET_AS_ARTIST_PICK/HIDE'

// action creators
export const showSetAsArtistPickConfirmation = (trackId?: ID) => ({
  type: SHOW_SET_AS_ARTIST_PICK_CONFIRMATION,
  trackId
})

export const cancelSetAsArtistPick = () => ({
  type: HIDE_SET_AS_ARTIST_PICK_CONFIRMATION
})

export type ShowSetAsArtistPickConfirmation = ReturnType<
  typeof showSetAsArtistPickConfirmation
>
export type CancelSetAsArtistPick = ReturnType<typeof cancelSetAsArtistPick>

// action interfaces
export type SetAsArtistPickConfirmationAction =
  | ShowSetAsArtistPickConfirmation
  | CancelSetAsArtistPick
