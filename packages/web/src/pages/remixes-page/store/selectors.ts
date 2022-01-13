import { getTrack as getCachedTrack } from 'common/store/cache/tracks/selectors'
import { getUserFromTrack } from 'common/store/cache/users/selectors'
import { AppState } from 'store/types'

export const getBaseState = (state: AppState) => state.application.pages.remixes

export const getLineup = (state: AppState) => getBaseState(state).tracks

export const getTrackId = (state: AppState) => getBaseState(state).page.trackId

export const getCount = (state: AppState) => getBaseState(state).page.count

export const getTrack = (state: AppState) => {
  const id = getTrackId(state)
  return getCachedTrack(state, { id })
}

export const getUser = (state: AppState) => {
  const id = getTrackId(state)
  return getUserFromTrack(state, { id })
}
