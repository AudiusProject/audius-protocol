import type { SearchCategory, SearchFilters } from '@audius/common/api'

export type SearchParams = {
  query?: string
  category?: SearchCategory
  filters?: SearchFilters
  autoFocus?: boolean
}
