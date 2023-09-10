import { ReactNode } from 'react'

import { SearchPageContentProps } from './components/mobile/SearchPageContent'

type SearchPageProviderProps = {
  scrollToTop: () => void
  containerRef: ReactNode
  isMobile: boolean
  children: (props: SearchPageContentProps) => JSX.Element
}

declare const SearchPageProvider = (props: SearchPageProviderProps) =>
  JSX.Element

export default SearchPageProvider
