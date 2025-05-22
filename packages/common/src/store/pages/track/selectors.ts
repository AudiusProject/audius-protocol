import { CommonState } from '~/store/commonStore'
import { PREFIX } from '~/store/pages/track/lineup/actions'

export const getBaseState = (state: CommonState) => state.pages.track

export const getTrackId = (state: CommonState) => getBaseState(state).trackId

export const getTrackPermalink = (state: CommonState) =>
  getBaseState(state).trackPermalink

export const getLineup = (state: CommonState) => getBaseState(state).tracks
export const getSourceSelector = (state: CommonState) =>
  `${PREFIX}:${getTrackId(state)}`
