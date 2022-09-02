import { createContext } from 'react'

export const SearchQueryContext = createContext({
  query: '',
  isTagSearch: false
})
