import { getTrack as getCachedTrack } from 'common/store/cache/tracks/selectors'
import { getUserFromTrack } from 'common/store/cache/users/selectors'
import { AppState } from 'store/types'

const getBaseState = (state: AppState) =>
  state.application.ui.remixSettingsModal
const getTrackId = (state: AppState) => getBaseState(state).trackId

export const getStatus = (state: AppState) => getBaseState(state).status

export const getTrack = (state: AppState) => {
  const id = getTrackId(state)
  if (!id) return null
  return getCachedTrack(state, { id })
}

export const getUser = (state: AppState) => {
  const id = getTrackId(state)
  if (!id) return null
  return getUserFromTrack(state, { id })
}
