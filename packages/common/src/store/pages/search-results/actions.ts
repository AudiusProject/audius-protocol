import { Genre, Mood } from '@audius/sdk'

import { SearchKind } from './types'

export const FETCH_SEARCH_PAGE_RESULTS = 'SEARCH/FETCH_SEARCH_PAGE_RESULTS'
export const FETCH_SEARCH_PAGE_RESULTS_SUCCEEDED =
  'SEARCH/FETCH_SEARCH_PAGE_RESULTS_SUCCEEDED'
export const FETCH_SEARCH_PAGE_RESULTS_FAILED =
  'SEARCH/FETCH_SEARCH_PAGE_RESULTS_FAILED'

export const FETCH_SEARCH_PAGE_TAGS = 'SEARCH/FETCH_SEARCH_PAGE_TAGS'
export const FETCH_SEARCH_PAGE_TAGS_SUCCEEDED =
  'SEARCH/FETCH_SEARCH_PAGE_TAGS_SUCCEEDED'
export const FETCH_SEARCH_PAGE_TAGS_FAILED =
  'SEARCH/FETCH_SEARCH_PAGE_TAGS_FAILED'

export type FetchSearchPageResultsAction = {
  type: typeof FETCH_SEARCH_PAGE_RESULTS
  searchText: string
  kind: SearchKind
  limit: number
  offset: number
  genre?: Genre
  mood?: Mood
  is_verified?: boolean
}

export type FetchSearchPageResultsSuceededAction = {
  type: typeof FETCH_SEARCH_PAGE_RESULTS_SUCCEEDED
  results: any
  searchText: string
}

export type FetchSearchPageResultsFailedAction = {
  type: typeof FETCH_SEARCH_PAGE_RESULTS_FAILED
}

export type FetchSearchPageTagsSucceededAction = {
  type: typeof FETCH_SEARCH_PAGE_TAGS_SUCCEEDED
  results: any
  tag: string
}

export type FetchSearchPageTagsFailedAction = {
  type: typeof FETCH_SEARCH_PAGE_TAGS_FAILED
}

export type FetchSearchPageTagsAction = {
  type: typeof FETCH_SEARCH_PAGE_TAGS
  tag: string
  searchKind: SearchKind
  limit: number
  offset: number
}

export type SearchPageActions =
  | FetchSearchPageResultsAction
  | FetchSearchPageResultsSuceededAction
  | FetchSearchPageResultsFailedAction
  | FetchSearchPageTagsSucceededAction
  | FetchSearchPageTagsFailedAction
  | FetchSearchPageTagsAction

// Query-based search

type FetchSearchPageResultsArgs = {
  searchText: string
  kind: SearchKind
  limit: number
  offset: number
  genre?: Genre
  mood?: Mood
  isVerified?: boolean
}

export const fetchSearchPageResults = (
  args: FetchSearchPageResultsArgs
): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_RESULTS,
  ...args
})

type fetchSearchPageResultsSucceededArgs = {
  results: any
  searchText: string
}

export const fetchSearchPageResultsSucceeded = (
  args: fetchSearchPageResultsSucceededArgs
): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_RESULTS_SUCCEEDED,
  ...args
})

export const fetchSearchPageResultsFailed = (): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_RESULTS_FAILED
})

// Tag-based searcxh
type FetchSearchPageTagsArgs = {
  tag: string
  searchKind: SearchKind
  limit: number
  offset: number
}

export const fetchSearchPageTags = (
  args: FetchSearchPageTagsArgs
): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_TAGS,
  ...args
})

type FetchSearchPageTagsSucceededArgs = {
  results: any
  tag: string
}

export const fetchSearchPageTagsSucceeded = (
  args: FetchSearchPageTagsSucceededArgs
): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_TAGS_SUCCEEDED,
  ...args
})

export const fetchSearchPageTagsFailed = (): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_TAGS_FAILED
})
