import type { Dispatch, SetStateAction } from 'react'
import { createContext, useCallback, useContext } from 'react'

import { type SearchCategory, type SearchFilters } from '@audius/common/api'
import { isEmpty } from 'lodash'

export const ALL_RESULTS_LIMIT = 5

type SearchContextType = {
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  category: SearchCategory
  setCategory: Dispatch<SetStateAction<SearchCategory>>
  filters: SearchFilters
  setFilters: Dispatch<SetStateAction<SearchFilters>>
  bpmType: string
  setBpmType: Dispatch<SetStateAction<string>>
  autoFocus: boolean
  setAutoFocus: Dispatch<SetStateAction<boolean>>
  active: boolean
}

export const SearchContext = createContext<SearchContextType>({
  query: '',
  setQuery: (_) => {},
  category: 'all',
  setCategory: (_) => {},
  filters: {},
  setFilters: (_) => {},
  // Special state to track how bpm is being set
  bpmType: 'range',
  setBpmType: (_) => {},
  // Special state to determine if the search query input should be focused automatically
  autoFocus: false,
  setAutoFocus: (_) => {},
  active: false
})

export const useIsEmptySearch = () => {
  const { query, filters } = useContext(SearchContext)
  return !query && isEmpty(filters)
}

export const useSearchQuery = () => {
  const { query, setQuery } = useContext(SearchContext)
  return [query, setQuery] as const
}

export const useSearchAutoFocus = () => {
  const { autoFocus, setAutoFocus } = useContext(SearchContext)
  return [autoFocus, setAutoFocus] as const
}

export const useSearchBpmType = () => {
  const { bpmType, setBpmType } = useContext(SearchContext)
  return [bpmType, setBpmType] as const
}

export const useSearchCategory = () => {
  const { category, setCategory } = useContext(SearchContext)
  return [category, setCategory] as const
}

export const useSearchFilters = () => {
  const { filters, setFilters } = useContext(SearchContext)
  return [filters, setFilters] as const
}

export const useSearchFilter = <F extends keyof SearchFilters>(
  filterKey: F
) => {
  const { filters, setFilters } = useContext(SearchContext)

  const filter = filters[filterKey]

  const setFilter = useCallback(
    (value: SearchFilters[F]) => {
      setFilters((filters) => {
        if (value === undefined) {
          // Remove the key if value is undefined
          const { [filterKey]: _, ...rest } = filters
          return rest
        }
        return { ...filters, [filterKey]: value }
      })
    },
    [filterKey, setFilters]
  )

  const clearFilter = useCallback(() => {
    setFilters((filters) => {
      const { [filterKey]: _, ...rest } = filters
      return rest
    })
  }, [filterKey, setFilters])

  return [filter, setFilter, clearFilter] as const
}
