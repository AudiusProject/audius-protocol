// @ts-nocheck
// TODO(nkang) - convert to TS
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

export const getTrackRanks = (trackId) => ({ type: GET_TRACK_RANKS, trackId })
export const setTrackRank = (duration, rank) => ({
  type: SET_TRACK_RANK,
  duration,
  rank
})
export const resetTrackPage = () => ({ type: RESET })
export const setTrackId = (trackId) => ({ type: SET_TRACK_ID, trackId })
export const setTrackPermalink = (permalink) => ({
  type: SET_TRACK_PERMALINK,
  permalink
})
export const makeTrackPublic = (trackId) => ({
  type: MAKE_TRACK_PUBLIC,
  trackId
})

export const fetchTrack = (
  trackId: Nullable<number>,
  slug?: string,
  handle?: string,
  canBeUnlisted?: boolean,
  forceRetrieveFromSource?: boolean,
  withRemixes?: boolean
) => ({
  type: FETCH_TRACK,
  trackId,
  slug,
  handle,
  canBeUnlisted,
  forceRetrieveFromSource,
  withRemixes
})
export const fetchTrackSucceeded = (trackId) => ({
  type: FETCH_TRACK_SUCCEEDED,
  trackId
})
export const fetchTrackFailed = (trackId) => ({ type: FETCH_TRACK_FAILED })

export const goToRemixesOfParentPage = (parentTrackId) => ({
  type: GO_TO_REMIXES_OF_PARENT_PAGE,
  parentTrackId
})

/**
 * Refreshes the lineup based on the track that's currently set.
 * Useful when the lineup's content depends on changes that may
 * happen to the track in view on the track page.
 */
export const refetchLineup = () => ({
  type: REFETCH_LINEUP
})

export const setTrackTrendingRanks = (trendingTrackRanks) => ({
  type: SET_TRACK_TRENDING_RANKS,
  trendingTrackRanks
})

export const setIsInitialFetchAfterSsr = (isInitialFetchAfterSsr: boolean) => ({
  type: SET_IS_INITIAL_FETCH_AFTER_SSR,
  isInitialFetchAfterSsr
})
