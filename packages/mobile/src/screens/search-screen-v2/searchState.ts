import type { Dispatch, SetStateAction } from 'react'
import { createContext, useCallback, useContext } from 'react'

import type {
  SearchCategory,
  SearchFilter,
  SearchFilters
} from '@audius/common/api'

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
