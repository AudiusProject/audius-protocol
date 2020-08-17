import { AppState } from 'store/types'

export const getSetAsArtistPickConfirmation = (state: AppState) => {
  return state.application.ui.setAsArtistPickConfirmation
}
