import { ID } from 'models/Identifiers'
import { TrendingRange } from 'store/notifications'

export const SET_TRACK_RANK = 'TRACK_PAGE/SET_TRACK_RANK'
export const GET_TRACK_RANKS = 'TRACK_PAGE/GET_TRACK_RANKS'
export const RESET = 'TRACK_PAGE/RESET'
export const SET_TRACK_ID = 'TRACK_PAGE/SET_TRACK_ID'
export const SET_TRACK_PERMALINK = 'TRACK_PAGE/SET_TRACK_PERMALINK'
export const MAKE_TRACK_PUBLIC = 'TRACK_PAGE/MAKE_TRACK_PUBLIC'
export const SET_TRACK_TRENDING_RANKS = 'TRACK_PAGE/SET_TRACK_TRENDING_RANKS'
export const SET_IS_INITIAL_FETCH_AFTER_SSR =
  'TRACK_PAGE/SET_IS_INITIAL_FETCH_AFTER_SSR'

export const FETCH_TRACK = 'TRACK_PAGE/FETCH_TRACK'
export const FETCH_TRACK_SUCCEEDED = 'TRACK_PAGE/FETCH_TRACK_SUCCEEDED'
export const FETCH_TRACK_FAILED = 'TRACK_PAGE/FETCH_TRACK_FAILED'

export const GO_TO_REMIXES_OF_PARENT_PAGE =
  'TRACK_PAGE/GO_TO_REMIXES_OF_PARENT_PAGE'

export const REFETCH_LINEUP = 'TRACK_PAGE/REFETCH_LINEUP'

export type ResetAction = {
  type: typeof RESET
}

export type GetTrackRanksAction = {
  type: typeof GET_TRACK_RANKS
  trackId: ID
}

export type SetTrackRankAction = {
  type: typeof SET_TRACK_RANK
  duration: TrendingRange
  rank: number | null
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

export type SetTrackTrendingRanksAction = {
  type: typeof SET_TRACK_TRENDING_RANKS
  trendingTrackRanks: Record<TrendingRange, ID[] | null>
}

export type SetIsInitialFetchAfterSSRAction = {
  type: typeof SET_IS_INITIAL_FETCH_AFTER_SSR
  isInitialFetchAfterSsr: boolean
}

export type FetchTrackAction = {
  type: typeof FETCH_TRACK
  trackId: ID | null
  slug?: string
  handle?: string
  canBeUnlisted?: boolean
  forceRetrieveFromSource?: boolean
  withRemixes?: boolean
}

export type FetchTrackSucceededAction = {
  type: typeof FETCH_TRACK_SUCCEEDED
  trackId: ID
}
export type FetchTrackFailedAction = {
  type: typeof FETCH_TRACK_FAILED
}

export type GoToRemixesOfParentPageAction = {
  type: typeof GO_TO_REMIXES_OF_PARENT_PAGE
  parentTrackId: ID
}

export type RefetchLineupAction = {
  type: typeof REFETCH_LINEUP
}

export type TrackPageAction =
  | ResetAction
  | SetTrackRankAction
  | GetTrackRanksAction
  | SetTrackIdAction
  | SetTrackPermalinkAction
  | MakeTrackPublicAction
  | SetTrackTrendingRanksAction
  | SetIsInitialFetchAfterSSRAction
  | FetchTrackAction
  | FetchTrackSucceededAction
  | FetchTrackFailedAction
  | GoToRemixesOfParentPageAction
  | RefetchLineupAction

export const getTrackRanks = (trackId: ID): GetTrackRanksAction => ({
  type: GET_TRACK_RANKS,
  trackId
})
export const setTrackRank = (
  duration: TrendingRange,
  rank: number | null
): SetTrackRankAction => ({
  type: SET_TRACK_RANK,
  duration,
  rank
})
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

export const fetchTrack = (
  trackId: ID | null,
  slug?: string,
  handle?: string,
  canBeUnlisted?: boolean,
  forceRetrieveFromSource?: boolean,
  withRemixes?: boolean
): FetchTrackAction => ({
  type: FETCH_TRACK,
  trackId,
  slug,
  handle,
  canBeUnlisted,
  forceRetrieveFromSource,
  withRemixes
})
export const fetchTrackSucceeded = (
  trackId: ID
): FetchTrackSucceededAction => ({
  type: FETCH_TRACK_SUCCEEDED,
  trackId
})
export const fetchTrackFailed = (_trackId: ID): FetchTrackFailedAction => ({
  type: FETCH_TRACK_FAILED
})

export const goToRemixesOfParentPage = (
  parentTrackId: ID
): GoToRemixesOfParentPageAction => ({
  type: GO_TO_REMIXES_OF_PARENT_PAGE,
  parentTrackId
})

/**
 * Refreshes the lineup based on the track that's currently set.
 * Useful when the lineup's content depends on changes that may
 * happen to the track in view on the track page.
 */
export const refetchLineup = (): RefetchLineupAction => ({
  type: REFETCH_LINEUP
})

export const setTrackTrendingRanks = (
  trendingTrackRanks: Record<TrendingRange, ID[] | null>
): SetTrackTrendingRanksAction => ({
  type: SET_TRACK_TRENDING_RANKS,
  trendingTrackRanks
})

export const setIsInitialFetchAfterSsr = (
  isInitialFetchAfterSsr: boolean
): SetIsInitialFetchAfterSSRAction => ({
  type: SET_IS_INITIAL_FETCH_AFTER_SSR,
  isInitialFetchAfterSsr
})
