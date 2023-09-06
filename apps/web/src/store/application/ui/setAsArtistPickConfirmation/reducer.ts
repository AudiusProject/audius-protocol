import * as pinTrackActions from 'store/application/ui/setAsArtistPickConfirmation/actions'
import { makeReducer } from 'utils/reducer'

import { SetAsArtistPickConfirmationState } from './types'

const initialState: SetAsArtistPickConfirmationState = {
  isVisible: false
}

const actionMap = {
  [pinTrackActions.SHOW_SET_AS_ARTIST_PICK_CONFIRMATION](
    state: SetAsArtistPickConfirmationState,
    action: pinTrackActions.ShowSetAsArtistPickConfirmation
  ): SetAsArtistPickConfirmationState {
    return {
      isVisible: true,
      trackId: action.trackId
    }
  },
  [pinTrackActions.HIDE_SET_AS_ARTIST_PICK_CONFIRMATION](
    state: SetAsArtistPickConfirmationState,
    action: pinTrackActions.CancelSetAsArtistPick
  ): SetAsArtistPickConfirmationState {
    return { isVisible: false }
  }
}

export default makeReducer(actionMap, initialState)
