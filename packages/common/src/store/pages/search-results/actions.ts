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

type FetchSearchPageResultsActionArgs = {
  searchText: string
  kind: SearchKind
  limit: number
  offset: number
  genre?: Genre
  mood?: Mood
  isVerified?: boolean
}

export const fetchSearchPageResults = (
  args: FetchSearchPageResultsActionArgs
): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_RESULTS,
  ...args
})

// TODO: update the rest of these actions to object args
export const fetchSearchPageResultsSucceeded = (
  results: any,
  searchText: string
): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_RESULTS_SUCCEEDED,
  results,
  searchText
})

export const fetchSearchPageResultsFailed = (): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_RESULTS_FAILED
})

// Tag-based searcxh

export const fetchSearchPageTags = (
  tag: string,
  searchKind: SearchKind,
  limit: number,
  offset: number
): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_TAGS,
  tag,
  searchKind,
  limit,
  offset
})

export const fetchSearchPageTagsSucceeded = (
  results: any,
  tag: string
): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_TAGS_SUCCEEDED,
  results,
  tag
})

export const fetchSearchPageTagsFailed = (): SearchPageActions => ({
  type: FETCH_SEARCH_PAGE_TAGS_FAILED
})
