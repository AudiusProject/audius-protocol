import { ExploreContent } from './types'

export const FETCH_EXPLORE = 'EXPLORE/FETCH_EXPLORE'
export const FETCH_EXPLORE_SUCCEEDED = 'EXPLORE/FETCH_EXPLORE_SUCCEEDED'
export const FETCH_EXPLORE_FAILED = 'EXPLORE/FETCH_EXPLORE_FAILED'

type FetchExploreAction = {
  type: typeof FETCH_EXPLORE
}

type FetchExploreSucceededAction = {
  type: typeof FETCH_EXPLORE_SUCCEEDED
  exploreContent: ExploreContent
}

type FetchExploreFailedAction = {
  type: typeof FETCH_EXPLORE_FAILED
}

export type ExplorePageActions =
  | FetchExploreAction
  | FetchExploreSucceededAction
  | FetchExploreFailedAction

export const fetchExplore = (): ExplorePageActions => ({
  type: FETCH_EXPLORE
})

export const fetchExploreSucceeded = (
  exploreContent: ExploreContent
): ExplorePageActions => ({
  type: FETCH_EXPLORE_SUCCEEDED,
  exploreContent
})

export const fetchExploreFailed = (): ExplorePageActions => ({
  type: FETCH_EXPLORE_FAILED
})
