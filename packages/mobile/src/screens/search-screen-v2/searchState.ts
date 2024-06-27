import type { Dispatch, SetStateAction } from 'react'
import { createContext, useCallback, useContext, useEffect } from 'react'

import {
  useGetSearchResults as useGetSearchResultsApi,
  type SearchCategory,
  type SearchFilter,
  type SearchFilters
} from '@audius/common/api'
import { useSelector } from 'react-redux'
import { accountSelectors } from '@audius/common/store'

const { getUserId } = accountSelectors

type SearchContextType = {
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  category: SearchCategory
  setCategory: Dispatch<SetStateAction<SearchCategory>>
  filters: SearchFilters
  setFilters: Dispatch<SetStateAction<SearchFilters>>
}

export const SearchContext = createContext<SearchContextType>({
  query: '',
  setQuery: (_) => {},
  category: 'all',
  setCategory: (_) => {},
  filters: {},
  setFilters: (_) => {}
})

export const useSearchQuery = () => {
  const { query, setQuery } = useContext(SearchContext)
  return [query, setQuery] as const
}

export const useSearchCategory = () => {
  const { category, setCategory } = useContext(SearchContext)
  return [category, setCategory] as const
}

export const useSearchFilter = <F extends SearchFilter>(filterKey: F) => {
  const { filters, setFilters } = useContext(SearchContext)

  const filter = filters[filterKey]

  const setFilter = useCallback(
    (value: SearchFilters[F]) => {
      setFilters((filters) => ({ ...filters, [filterKey]: value }))
    },
    [filterKey, setFilters]
  )

  const clearFilter = useCallback(() => {
    setFilters((filters) => ({ ...filters, [filterKey]: undefined }))
  }, [filterKey, setFilters])

  return [filter, setFilter, clearFilter] as const
}

type SearchResultsApiType = ReturnType<typeof useGetSearchResultsApi>

type SearchResultsType<C extends SearchCategory> = {
  status: SearchResultsApiType['status']
  data: C extends 'all'
    ? SearchResultsApiType['data']
    : SearchResultsApiType['data'][Exclude<C, 'all'>]
}

export const useGetSearchResults = <C extends SearchCategory>(
  category: C
): SearchResultsType<C> => {
  const { filters, query } = useContext(SearchContext)
  const currentUserId = useSelector(getUserId)
  const { data, status } = useGetSearchResultsApi({
    query,
    ...filters,
    category,
    currentUserId
  })

  if (category === 'all') {
    return { data, status } as SearchResultsType<C>
  } else {
    return {
      data: data?.[category as Exclude<C, 'all'>],
      status
    } as SearchResultsType<C>
  }
}
