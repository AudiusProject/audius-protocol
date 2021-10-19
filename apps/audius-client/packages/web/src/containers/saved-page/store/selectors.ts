import { ID } from 'common/models/Identifiers'
import { AppState } from 'store/types'

export const getSaved = (state: AppState) => state.saved
export const getSaves = (state: AppState) => state.saved.saves
export const getLocalSaves = (state: AppState) => state.saved.localSaves
export const getLocalSave = (state: AppState, props: { id: ID }) =>
  state.saved.localSaves[props.id]

export const getSavedTracksLineup = (state: AppState) => state.saved.tracks
export const getSavedTracksLineupUid = (state: AppState, props: { id: ID }) => {
  const track = state.saved.tracks.entries.find(t => t.id === props.id)
  return track ? track.uid : null
}
