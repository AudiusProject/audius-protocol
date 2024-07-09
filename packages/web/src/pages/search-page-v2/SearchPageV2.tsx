import { useCallback, useContext, useEffect } from 'react'

import { SearchCategory } from '@audius/common/src/api/search'
import { Flex } from '@audius/harmony'
import { generatePath, useParams } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { useHistoryContext } from 'app/HistoryProvider'
import { RouterContext } from 'components/animated-switch/RouterContextProvider'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  CenterPreset,
  LeftPreset,
  RightPreset
} from 'components/nav/mobile/NavContext'
import Page from 'components/page/Page'
import { useMedia } from 'hooks/useMedia'
import { SEARCH_PAGE, fullSearchResultsPageV2 } from 'utils/route'

import { RecentSearches } from './RecentSearches'
import { SearchCatalogTile } from './SearchCatalogTile'
import { CategoryKey, SearchHeader } from './SearchHeader'
import { SearchResults } from './SearchResults'

const useShowSearchResults = () => {
  const [urlSearchParams] = useSearchParams()
  const query = urlSearchParams.get('query')
  const genre = urlSearchParams.get('genre')
  const mood = urlSearchParams.get('mood')
  const bpm = urlSearchParams.get('bpm')
  const key = urlSearchParams.get('key')
  const isVerified = urlSearchParams.get('isVerified')
  const hasDownloads = urlSearchParams.get('hasDownloads')
  const isPremium = urlSearchParams.get('isPremium')

  return (
    query ||
    genre ||
    mood ||
    isVerified ||
    hasDownloads ||
    bpm ||
    key ||
    isPremium
  )
}

export const SearchPageV2 = () => {
  const { isMobile } = useMedia()
  const { category } = useParams<{ category: CategoryKey }>()
  const { history } = useHistoryContext()
  const [urlSearchParams] = useSearchParams()
  const query = urlSearchParams.get('query')
  const showSearchResults = useShowSearchResults()
  const { setStackReset } = useContext(RouterContext)

  // Set nav header
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(CenterPreset.LOGO)
    setRight(RightPreset.SEARCH)
  }, [setLeft, setCenter, setRight])

  const setCategory = useCallback(
    (category: CategoryKey) => {
      // Do not animate on mobile
      setStackReset(true)

      history.push({
        pathname: generatePath(SEARCH_PAGE, { category }),
        search: query ? new URLSearchParams({ query }).toString() : undefined,
        state: {}
      })
    },
    [history, query, setStackReset]
  )

  const header = (
    <SearchHeader
      query={query ?? undefined}
      title={'Search'}
      category={category as CategoryKey}
      setCategory={setCategory}
    />
  )

  const PageComponent = isMobile ? MobilePageContainer : Page

  return (
    <PageComponent
      title={query ?? 'Search'}
      description={`Search results for ${query}`}
      canonicalUrl={fullSearchResultsPageV2(
        category as SearchCategory,
        query ?? ''
      )}
      header={header}
    >
      <Flex direction='column' w='100%'>
        {isMobile ? header : null}
        {!showSearchResults ? (
          <Flex
            direction='column'
            alignItems='center'
            gap={isMobile ? 'xl' : 'l'}
          >
            <SearchCatalogTile />
            <RecentSearches />
          </Flex>
        ) : (
          <SearchResults />
        )}
      </Flex>
    </PageComponent>
  )
}
