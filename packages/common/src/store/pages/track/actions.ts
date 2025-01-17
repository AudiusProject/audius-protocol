import { ID } from '~/models/Identifiers'

export const RESET = 'TRACK_PAGE/RESET'
export const SET_TRACK_ID = 'TRACK_PAGE/SET_TRACK_ID'
export const SET_TRACK_PERMALINK = 'TRACK_PAGE/SET_TRACK_PERMALINK'
export const MAKE_TRACK_PUBLIC = 'TRACK_PAGE/MAKE_TRACK_PUBLIC'

export const FETCH_TRACK_SUCCEEDED = 'TRACK_PAGE/FETCH_TRACK_SUCCEEDED'

export const GO_TO_REMIXES_OF_PARENT_PAGE =
  'TRACK_PAGE/GO_TO_REMIXES_OF_PARENT_PAGE'

export const REFETCH_LINEUP = 'TRACK_PAGE/REFETCH_LINEUP'

export type ResetAction = {
  type: typeof RESET
}

export type SetTrackIdAction = {
  type: typeof SET_TRACK_ID
  trackId: ID
}

export type SetTrackPermalinkAction = {
  type: typeof SET_TRACK_PERMALINK
  permalink: string
}

export type MakeTrackPublicAction = {
  type: typeof MAKE_TRACK_PUBLIC
  trackId: ID
}

export type FetchTrackSucceededAction = {
  type: typeof FETCH_TRACK_SUCCEEDED
  trackId: ID
}

export type RefetchLineupAction = {
  type: typeof REFETCH_LINEUP
}

export type TrackPageAction =
  | ResetAction
  | SetTrackIdAction
  | SetTrackPermalinkAction
  | MakeTrackPublicAction
  | FetchTrackSucceededAction
  | RefetchLineupAction

export const resetTrackPage = (): ResetAction => ({ type: RESET })
export const setTrackId = (trackId: ID): SetTrackIdAction => ({
  type: SET_TRACK_ID,
  trackId
})
export const setTrackPermalink = (
  permalink: string
): SetTrackPermalinkAction => ({
  type: SET_TRACK_PERMALINK,
  permalink
})
export const makeTrackPublic = (trackId: ID): MakeTrackPublicAction => ({
  type: MAKE_TRACK_PUBLIC,
  trackId
})

export const fetchTrackSucceeded = (
  trackId: ID
): FetchTrackSucceededAction => ({
  type: FETCH_TRACK_SUCCEEDED,
  trackId
})

/**
 * Refreshes the lineup based on the track that's currently set.
 * Useful when the lineup's content depends on changes that may
 * happen to the track in view on the track page.
 */
export const refetchLineup = (): RefetchLineupAction => ({
  type: REFETCH_LINEUP
})
