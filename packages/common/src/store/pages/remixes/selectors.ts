import { getTrack as getCachedTrack } from '~/store/cache/tracks/selectors'
import { getUserFromTrack } from '~/store/cache/users/combinedSelectors'
import { CommonState } from '~/store/commonStore'

export const getBaseState = (state: CommonState) => state.pages.remixes

export const getLineup = (state: CommonState) => getBaseState(state).tracks

export const getTrackId = (state: CommonState) =>
  getBaseState(state).page.trackId

export const getCount = (state: CommonState) => getBaseState(state).page.count

export const getTrack = (state: CommonState) => {
  const id = getTrackId(state)
  return getCachedTrack(state, { id })
}

export const getUser = (state: CommonState) => {
  const id = getTrackId(state)
  return getUserFromTrack(state, { id })
}
