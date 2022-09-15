import { CommonState } from 'store/commonStore'

import { ID } from '../../../models/Identifiers'

export const getSaved = (state: CommonState) => state.pages.savedPage
export const getSaves = (state: CommonState) => state.pages.savedPage.saves
export const getLocalSaves = (state: CommonState) =>
  state.pages.savedPage.localSaves
export const getLocalSave = (state: CommonState, props: { id: ID }) =>
  state.pages.savedPage.localSaves[props.id]
export const getInitialFetchStatus = (state: CommonState) =>
  state.pages.savedPage.initialFetch

export const getSavedTracksStatus = (state: CommonState) =>
  state.pages.savedPage.tracks.status
export const getSavedTracksLineup = (state: CommonState) =>
  state.pages.savedPage.tracks
export const getSavedTracksLineupUid = (
  state: CommonState,
  props: { id: ID }
) => {
  const track = state.pages.savedPage.tracks.entries.find(
    // @ts-ignore
    (t) => t.id === props.id
  )
  return track ? track.uid : null
}
